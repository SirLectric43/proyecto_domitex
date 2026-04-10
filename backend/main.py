import os
from datetime import datetime, timezone
from typing import Optional, Dict, List
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from itertools import groupby
import random
import string

load_dotenv()

app = FastAPI(title="API Domitex")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class ArticuloResponse(BaseModel):
    id: str
    nombre: str
    imagen_url: str
    categoria: str

class RegistroUsuario(BaseModel):
    correo: str
    contrasena: str
    nombre: str
    apellidos: str
    telefono: str

class LoginUsuario(BaseModel):
    correo: str
    contrasena: str

class ActualizarUsuario(BaseModel):
    nombre: str
    apellidos: str
    telefono: str
    direccion: Optional[str] = None

class CambiarContrasena(BaseModel):
    contrasena_actual: str
    nueva_contrasena: str
    
class ActualizarCantidad(BaseModel):
    cantidad: int

class AnadirItem(BaseModel):
    articulo_medida_id: str
    cantidad: int

@app.get("/")
def read_root():
    return {"mensaje": "API de Domitex funcionando correctamente 🚀"}

@app.post("/usuarios")
def registrar_usuario(usuario: RegistroUsuario):
    try:
        respuesta = supabase.auth.sign_up({
            "email": usuario.correo,
            "password": usuario.contrasena,
            "options": {
                "data": {
                    "nombre": usuario.nombre,
                    "apellidos": usuario.apellidos,
                    "telefono": usuario.telefono,
                }
            }
        })
        
        return {
            "exito": True, 
            "mensaje": "Cuenta creada con éxito. Por favor, revisa tu correo para verificarla."
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
def iniciar_sesion(credenciales: LoginUsuario):
    try:
        respuesta = supabase.auth.sign_in_with_password({
            "email": credenciales.correo,
            "password": credenciales.contrasena
        })
        
        usuario_id = respuesta.user.id
        ahora_utc = datetime.now(timezone.utc).isoformat()
        
        supabase.table("usuarios").update({
            "ultimo_acceso": ahora_utc
        }).eq("id", usuario_id).execute()

        db_user = supabase.table("usuarios").select("nombre").eq("id", usuario_id).execute()
        
        if db_user.data and len(db_user.data) > 0 and db_user.data[0].get("nombre"):
            nombre_usuario = db_user.data[0]["nombre"]
        else:
            nombre_usuario = respuesta.user.user_metadata.get("nombre", "Usuario")
        
        return {
            "exito": True,
            "mensaje": "Sesión iniciada correctamente",
            "token": respuesta.session.access_token,
            "usuario_id": usuario_id,
            "nombre": nombre_usuario
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/usuarios/{usuario_id}")
def obtener_perfil(usuario_id: str, authorization: str = Header(None)):
    try:
        respuesta = supabase.table("usuarios").select("*").eq("id", usuario_id).execute()
        datos_perfil = respuesta.data[0] if respuesta.data else {}
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            try:
                user_auth = supabase.auth.get_user(token)
                datos_perfil["correo"] = user_auth.user.email
            except Exception:
                pass
                
        return datos_perfil
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/usuarios/{usuario_id}")
def actualizar_perfil(usuario_id: str, datos: ActualizarUsuario):
    try:
        supabase.table("usuarios").update({
            "nombre": datos.nombre,
            "apellidos": datos.apellidos,
            "telefono": datos.telefono,
            "direccion": datos.direccion
        }).eq("id", usuario_id).execute()
        
        return {"exito": True, "mensaje": "Perfil actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/usuarios/{usuario_id}/contrasena")
def cambiar_contrasena_api(usuario_id: str, datos: CambiarContrasena, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No estás autorizado para realizar esta acción.")
    
    token = authorization.split(" ")[1]
    
    try:
        user_response = supabase.auth.get_user(token)
        email = user_response.user.email
        
        try:
            supabase.auth.sign_in_with_password({"email": email, "password": datos.contrasena_actual})
        except Exception:
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta.")
            
        supabase.auth.update_user({"password": datos.nueva_contrasena})
        
        return {"exito": True, "mensaje": "Contraseña cambiada correctamente"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail="Hubo un error al cambiar la contraseña.")

@app.get("/articulos", response_model=Dict[str, List[ArticuloResponse]])
def obtener_catalogo_agrupado(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado.")
    
    try:
        respuesta = supabase.table("articulos").select("id, nombre, imagen_url, categoria").execute()
        
        if not respuesta.data:
            return {}

        datos_ordenados = sorted(respuesta.data, key=lambda x: x.get('categoria') or 'Otros')
        
        catalogo_agrupado = {}
        for categoria, articulos in groupby(datos_ordenados, key=lambda x: x.get('categoria') or 'Otros'):
            catalogo_agrupado[categoria] = list(articulos)

        return catalogo_agrupado

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/articulos/buscar")
def buscar_articulos(q: str):
    try:
        if not q or len(q.strip()) < 2:
            return []
        respuesta = supabase.table("articulos").select("id, nombre, imagen_url").ilike("nombre", f"%{q}%").execute()
        return respuesta.data[:5] if respuesta.data else []
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/articulos/{articulo_id}")
def obtener_detalle_articulo(articulo_id: str, authorization: str = Header(None)):
    try:
        resp_articulo = supabase.table("articulos").select("*").eq("id", articulo_id).execute()
        if not resp_articulo.data:
            raise HTTPException(status_code=404, detail="Artículo no encontrado")
        
        articulo = resp_articulo.data[0]
        
        resp_medidas = supabase.table("articulos_medidas").select("*").eq("articulo_id", articulo_id).execute()
        
        articulo["medidas"] = resp_medidas.data if resp_medidas.data else []
        
        return articulo
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/carrito")
def obtener_carrito(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.split(" ")[1]
        user_auth = supabase.auth.get_user(token)
        usuario_id = user_auth.user.id

        resp_carrito = supabase.table("carritos").select("id").eq("usuario_id", usuario_id).execute()
        if not resp_carrito.data:
            return []
        carrito_id = resp_carrito.data[0]["id"]

        resp_items = supabase.table("carrito_items") \
            .select("id, cantidad, articulos_medidas(id, medida, precio, articulos(id, nombre, imagen_url))") \
            .eq("carrito_id", carrito_id) \
            .order("id") \
            .execute()
            
        return resp_items.data if resp_items.data else []
    except Exception as e:
        print(f"Error GET carrito: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/carrito/items/{item_id}")
def actualizar_cantidad_item(item_id: str, datos: ActualizarCantidad, authorization: str = Header(None)):
    try:
        if datos.cantidad > 0:
            supabase.table("carrito_items").update({"cantidad": datos.cantidad}).eq("id", item_id).execute()
        else:
            supabase.table("carrito_items").delete().eq("id", item_id).execute()
        return {"exito": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/carrito/anadir")
def anadir_al_carrito(datos: AnadirItem, authorization: str = Header(None)):
    try:
        token = authorization.split(" ")[1]
        user_auth = supabase.auth.get_user(token)
        usuario_id = user_auth.user.id

        resp_carrito = supabase.table("carritos").select("id").eq("usuario_id", usuario_id).execute()
        if not resp_carrito.data:
            raise HTTPException(status_code=400, detail="El carrito no existe. Error de base de datos.")
        carrito_id = resp_carrito.data[0]["id"]

        resp_existe = supabase.table("carrito_items").select("id, cantidad").eq("carrito_id", carrito_id).eq("articulo_medida_id", datos.articulo_medida_id).execute()

        if resp_existe.data:
            nueva_cantidad = resp_existe.data[0]["cantidad"] + datos.cantidad
            supabase.table("carrito_items").update({"cantidad": nueva_cantidad}).eq("id", resp_existe.data[0]["id"]).execute()
        else:
            supabase.table("carrito_items").insert({
                "carrito_id": carrito_id,
                "articulo_medida_id": datos.articulo_medida_id,
                "cantidad": datos.cantidad
            }).execute()

        return {"exito": True, "mensaje": "Añadido a la cesta correctamente"}
    except Exception as e:
        print(f"Error POST carrito: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/pedidos/historial")
def obtener_historial_pedidos(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.split(" ")[1]
        user_auth = supabase.auth.get_user(token)
        usuario_id = user_auth.user.id

        resp_pedidos = supabase.table("pedidos") \
            .select("id, referencia, fecha_pedido, estado, total") \
            .eq("usuario_id", usuario_id) \
            .order("fecha_pedido", desc=True) \
            .execute()
            
        return resp_pedidos.data if resp_pedidos.data else []
    except Exception as e:
        print(f"Error GET historial pedidos: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
@app.post("/pedidos/confirmar")
def confirmar_pedido(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        user_auth = supabase.auth.get_user(token)
        usuario_id = user_auth.user.id

        resp_carrito = supabase.table("carritos").select("id").eq("usuario_id", usuario_id).execute()
        if not resp_carrito.data:
            raise HTTPException(status_code=400, detail="Carrito no encontrado")
        carrito_id = resp_carrito.data[0]["id"]

        resp_items = supabase.table("carrito_items") \
            .select("id, cantidad, articulo_medida_id, articulos_medidas(precio)") \
            .eq("carrito_id", carrito_id).execute()
        
        items = resp_items.data
        if not items:
            raise HTTPException(status_code=400, detail="El carrito está vacío")

        total_pedido = sum(item["cantidad"] * item["articulos_medidas"]["precio"] for item in items)
        
        resp_ultimo = supabase.table("pedidos") \
            .select("referencia") \
            .order("fecha_pedido", desc=True) \
            .limit(1).execute()

        if not resp_ultimo.data:
            referencia = "00001A"
        else:
            ultima_ref = resp_ultimo.data[0]["referencia"] 
            numero_str = ultima_ref[:-1] 
            letra = ultima_ref[-1]       
            
            numero = int(numero_str)

            if numero < 99999:
                numero += 1
            else:
                numero = 1
                codigo_ascii = ord(letra)
                nueva_letra = chr(codigo_ascii + 1) 
                if nueva_letra > 'Z':
                    raise HTTPException(status_code=400, detail="Límite máximo de referencias alcanzado (99999Z)")
                letra = nueva_letra
            referencia = f"{numero:05d}{letra}"

        resp_pedido = supabase.table("pedidos").insert({
            "usuario_id": usuario_id,
            "referencia": referencia,
            "estado": "Pendiente",
            "total": total_pedido
        }).execute()
        
        pedido_id = resp_pedido.data[0]["id"]

        lineas = []
        for item in items:
            lineas.append({
                "pedido_id": pedido_id,
                "articulo_medida_id": item["articulo_medida_id"],
                "cantidad": item["cantidad"],
                "precio_unitario": item["articulos_medidas"]["precio"]
            })
            
        supabase.table("lineas_pedido").insert(lineas).execute()

        supabase.table("carrito_items").delete().eq("carrito_id", carrito_id).execute()

        return {"exito": True, "referencia": referencia}

    except Exception as e:
        print(f"Error POST confirmar pedido: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/pedidos/{pedido_id}")
def obtener_detalle_pedido(pedido_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        user_auth = supabase.auth.get_user(token)
        usuario_id = user_auth.user.id

        resp_pedido = supabase.table("pedidos").select(
            "id, referencia, fecha_pedido, estado, total, "
            "lineas_pedido(cantidad, precio_unitario, articulos_medidas(medida, articulos(nombre, imagen_url)))"
        ).eq("id", pedido_id).eq("usuario_id", usuario_id).single().execute()

        if not resp_pedido.data:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        return resp_pedido.data

    except Exception as e:
        print(f"Error GET detalle pedido: {e}")
        raise HTTPException(status_code=400, detail=str(e))