import os
import math
from datetime import datetime, timezone
from typing import Optional, Dict, List
from fastapi import FastAPI, HTTPException, Header, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from itertools import groupby

load_dotenv()

app = FastAPI(title="API Domitex")

api_router = APIRouter(prefix="/api")

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
    imagen_url: Optional[str] = None
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
    
class MedidaCrear(BaseModel):
    medida: str
    precio: float
    stock: int
    disponible: Optional[bool] = True

class MedidaModificar(BaseModel):
    id: Optional[str] = None 
    medida: str
    precio: float
    stock: int
    disponible: Optional[bool] = True

class ArticuloCrear(BaseModel):
    nombre: str
    descripcion: str
    categoria: str
    imagen_base64: Optional[str] = None
    medidas: List[MedidaCrear]

class ArticuloModificar(BaseModel):
    nombre: str
    descripcion: str
    categoria: str
    imagen_base64: Optional[str] = None
    medidas: List[MedidaModificar]

class CategoriaCrear(BaseModel):
    nombre: str
    
class AdminCrearUsuario(BaseModel):
    nombre: str
    apellidos: str
    correo: str
    contrasena: str
    rol: str
    telefono: str

class AdminActualizarUsuario(BaseModel):
    nombre: str
    apellidos: str
    telefono: str
    direccion: Optional[str] = None
    rol: str

class AdminActualizarEstadoPedido(BaseModel):
    estado: str

class LineaPedidoActualizar(BaseModel):
    id: str
    preparados: int

class ActualizarLineasPedido(BaseModel):
    lineas: List[LineaPedidoActualizar]

@api_router.get("/")
def read_root():
    return {"mensaje": "API de Domitex funcionando correctamente"}

@api_router.post("/usuarios")
def registrar_usuario(usuario: RegistroUsuario):
    try:
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        respuesta = auth_client.auth.sign_up({
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

@api_router.post("/login")
def iniciar_sesion(credenciales: LoginUsuario):
    try:
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        respuesta = auth_client.auth.sign_in_with_password({
            "email": credenciales.correo,
            "password": credenciales.contrasena
        })
        
        usuario_id = respuesta.user.id
        ahora_utc = datetime.now(timezone.utc).isoformat()
        
        supabase.table("usuarios").update({
            "ultimo_acceso": ahora_utc
        }).eq("id", usuario_id).execute()

        db_user = supabase.table("usuarios").select("nombre, rol").eq("id", usuario_id).execute()
        
        if db_user.data and len(db_user.data) > 0:
            nombre_usuario = db_user.data[0].get("nombre") or respuesta.user.user_metadata.get("nombre", "Usuario")
            rol_usuario = db_user.data[0].get("rol") or "cliente"
        else:
            nombre_usuario = respuesta.user.user_metadata.get("nombre", "Usuario")
            rol_usuario = "cliente"
        
        return {
            "exito": True,
            "mensaje": "Sesión iniciada correctamente",
            "token": respuesta.session.access_token,
            "usuario_id": usuario_id,
            "nombre": nombre_usuario,
            "rol": rol_usuario
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/usuarios")
def obtener_todos_usuarios(nombre: Optional[str] = None, rol: Optional[str] = None, page: int = 1, limit: int = 20, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.split(" ")[1]
        user_auth = supabase.auth.get_user(token)
        usuario_id = user_auth.user.id
        
        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores pueden ver los usuarios")
            
        consulta = supabase.table("usuarios").select("id, nombre, apellidos, rol, ultimo_acceso", count="exact")
        
        if nombre:
            consulta = consulta.ilike("nombre", f"%{nombre}%")
        if rol and rol != "Todos":
            consulta = consulta.eq("rol", rol.lower())

        start = (page - 1) * limit
        end = start + limit - 1
        respuesta = consulta.range(start, end).execute()
        
        total_pages = math.ceil(respuesta.count / limit) if respuesta.count else 0
        
        return {"data": respuesta.data, "total_pages": total_pages, "current_page": page}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/usuarios/{usuario_id}")
def obtener_perfil(usuario_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        requester_auth = auth_client.auth.get_user(token)
        requester_id = requester_auth.user.id

        respuesta = supabase.table("usuarios").select("*").eq("id", usuario_id).execute()
        if not respuesta.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        datos_perfil = respuesta.data[0]

        db_requester = supabase.table("usuarios").select("rol").eq("id", requester_id).execute()
        es_admin = db_requester.data and db_requester.data[0].get("rol") == "admin"

        if requester_id == usuario_id or es_admin:
            target_user = auth_client.auth.admin.get_user_by_id(usuario_id)
            datos_perfil["correo"] = target_user.user.email
                
        return datos_perfil
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/pedidos/historial")
def obtener_historial_pedidos(usuario_id: Optional[str] = None, estado: Optional[str] = None, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None, page: int = 1, limit: int = 15, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        requester_id = user_auth.user.id

        target_id = requester_id

        if usuario_id and usuario_id != requester_id:
            db_user = supabase.table("usuarios").select("rol").eq("id", requester_id).execute()
            if db_user.data and db_user.data[0].get("rol") == "admin":
                target_id = usuario_id
            else:
                raise HTTPException(status_code=403, detail="No tienes permiso para ver pedidos de otros usuarios")

        consulta = supabase.table("pedidos").select("id, referencia, fecha_pedido, estado, total", count="exact").eq("usuario_id", target_id).order("fecha_pedido", desc=True)

        if estado and estado != "Todos":
            consulta = consulta.eq("estado", estado)
        if fecha_inicio:
            consulta = consulta.gte("fecha_pedido", fecha_inicio)
        if fecha_fin:
            consulta = consulta.lte("fecha_pedido", f"{fecha_fin}T23:59:59")

        start = (page - 1) * limit
        end = start + limit - 1
        resp_pedidos = consulta.range(start, end).execute()
            
        total_pages = math.ceil(resp_pedidos.count / limit) if resp_pedidos.count else 0
        
        return {"data": resp_pedidos.data if resp_pedidos.data else [], "total_pages": total_pages, "current_page": page}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/usuarios/{usuario_id}")
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

@api_router.delete("/usuarios/{id_borrar}")
def eliminar_usuario(id_borrar: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.split(" ")[1]
        user_auth = supabase.auth.get_user(token)
        usuario_id = user_auth.user.id
        
        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar usuarios")
            
        try:
            auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            auth_client.auth.admin.delete_user(id_borrar)
        except Exception:
            pass
            
        supabase.table("usuarios").delete().eq("id", id_borrar).execute()
        return {"exito": True, "mensaje": "Usuario eliminado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/usuarios/{usuario_id}/contrasena")
def cambiar_contrasena_api(usuario_id: str, datos: CambiarContrasena, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No estás autorizado para realizar esta acción.")
    
    token = authorization.split(" ")[1]
    
    try:
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_response = auth_client.auth.get_user(token)
        email = user_response.user.email
        
        try:
            auth_client.auth.sign_in_with_password({"email": email, "password": datos.contrasena_actual})
        except Exception:
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta.")
            
        auth_client.auth.update_user({"password": datos.nueva_contrasena})
        
        return {"exito": True, "mensaje": "Contraseña cambiada correctamente"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail="Hubo un error al cambiar la contraseña.")

@api_router.get("/categorias")
def obtener_categorias():
    try:
        respuesta = supabase.table("categorias").select("*").order("nombre").execute()
        return respuesta.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/articulos")
def obtener_catalogo_agrupado(page: int = 1, limit: int = 8, authorization: str = Header(None)):
    try:
        es_admin = False
        if authorization and authorization.startswith("Bearer "):
            try:
                token = authorization.split(" ")[1]
                user_auth = supabase.auth.get_user(token)
                if user_auth and user_auth.user:
                    db_user = supabase.table("usuarios").select("rol").eq("id", user_auth.user.id).execute()
                    if db_user.data and db_user.data[0].get("rol") == "admin":
                        es_admin = True
            except:
                pass

        resp_cat = supabase.table("articulos").select("categoria").execute()
        if not resp_cat.data:
            return {"data": {}, "total_pages": 0, "current_page": page}

        todas_categorias = sorted(list(set([item['categoria'] for item in resp_cat.data])))
        total_categorias = len(todas_categorias)
        total_pages = math.ceil(total_categorias / limit) if total_categorias > 0 else 0

        offset = (page - 1) * limit
        categorias_pagina = todas_categorias[offset:offset + limit]

        if not categorias_pagina:
            return {"data": {}, "total_pages": total_pages, "current_page": page}

        respuesta = supabase.table("articulos").select("id, nombre, imagen_url, categoria, categorias(nombre), articulos_medidas(disponible)").in_("categoria", categorias_pagina).execute()
        
        if not respuesta.data:
            return {"data": {}, "total_pages": total_pages, "current_page": page}

        datos_procesados = []
        for item in respuesta.data:
            medidas = item.get("articulos_medidas", [])
            tiene_disponible = any(m.get("disponible", False) for m in medidas)
            
            if not es_admin and not tiene_disponible:
                continue 

            cat_info = item.get('categorias')
            cat_nombre = cat_info.get('nombre') if cat_info else 'Otros'
            datos_procesados.append({
                "id": item['id'],
                "nombre": item['nombre'],
                "imagen_url": item['imagen_url'],
                "categoria": cat_nombre
            })

        datos_ordenados = sorted(datos_procesados, key=lambda x: x['categoria'])
        
        catalogo_agrupado = {}
        for categoria, articulos in groupby(datos_ordenados, key=lambda x: x['categoria']):
            catalogo_agrupado[categoria] = list(articulos)

        return {"data": catalogo_agrupado, "total_pages": total_pages, "current_page": page}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@api_router.get("/articulos/buscar")
def buscar_articulos(q: str, authorization: str = Header(None)):
    try:
        if not q or len(q.strip()) < 2:
            return []
            
        es_admin = False
        if authorization and authorization.startswith("Bearer "):
            try:
                token = authorization.split(" ")[1]
                user_auth = supabase.auth.get_user(token)
                if user_auth and user_auth.user:
                    db_user = supabase.table("usuarios").select("rol").eq("id", user_auth.user.id).execute()
                    if db_user.data and db_user.data[0].get("rol") == "admin":
                        es_admin = True
            except:
                pass

        respuesta = supabase.table("articulos").select("id, nombre, imagen_url, articulos_medidas(disponible)").ilike("nombre", f"%{q}%").execute()
        
        resultados = []
        if respuesta.data:
            for item in respuesta.data:
                medidas = item.get("articulos_medidas", [])
                tiene_disponible = any(m.get("disponible", False) for m in medidas)
                
                if es_admin or tiene_disponible:
                    resultados.append({
                        "id": item["id"],
                        "nombre": item["nombre"],
                        "imagen_url": item["imagen_url"]
                    })
                    
        return resultados[:5]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/categorias")
def crear_categoria(categoria: CategoriaCrear, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        resp = supabase.table("categorias").insert({"nombre": categoria.nombre}).execute()
        return resp.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@api_router.get("/articulos/{articulo_id}")
def obtener_detalle_articulo(articulo_id: str, authorization: str = Header(None)):
    try:
        resp_articulo = supabase.table("articulos").select("*, categorias(nombre)").eq("id", articulo_id).execute()
        if not resp_articulo.data:
            raise HTTPException(status_code=404, detail="Artículo no encontrado")
        
        articulo = resp_articulo.data[0]
        
        cat_info = articulo.get('categorias')
        articulo["categoria_nombre"] = cat_info.get('nombre') if cat_info else 'Otros'
        
        resp_medidas = supabase.table("articulos_medidas").select("*").eq("articulo_id", articulo_id).execute()
        articulo["medidas"] = resp_medidas.data if resp_medidas.data else []
        
        return articulo
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@api_router.get("/carrito")
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

@api_router.put("/carrito/items/{item_id}")
def actualizar_cantidad_item(item_id: str, datos: ActualizarCantidad, authorization: str = Header(None)):
    try:
        if datos.cantidad > 0:
            supabase.table("carrito_items").update({"cantidad": datos.cantidad}).eq("id", item_id).execute()
        else:
            supabase.table("carrito_items").delete().eq("id", item_id).execute()
        return {"exito": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/carrito/anadir")
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
    
@api_router.post("/pedidos/confirmar")
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
            .select("id, cantidad, articulo_medida_id, articulos_medidas(precio, stock, medida, articulos(nombre))") \
            .eq("carrito_id", carrito_id).execute()
        
        items = resp_items.data
        if not items:
            raise HTTPException(status_code=400, detail="El carrito está vacío")

        for item in items:
            stock_actual = item["articulos_medidas"]["stock"]
            cantidad_pedida = item["cantidad"]
            
            if cantidad_pedida > stock_actual:
                nombre_art = item["articulos_medidas"]["articulos"]["nombre"]
                medida_art = item["articulos_medidas"]["medida"]
                raise HTTPException(
                    status_code=400, 
                    detail=f"Sin stock suficiente para: {nombre_art} ({medida_art}). Quedan {stock_actual} uds."
                )

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
            
            nuevo_stock = item["articulos_medidas"]["stock"] - item["cantidad"]
            datos_medida = {"stock": nuevo_stock}
            
            if nuevo_stock <= 0:
                datos_medida["disponible"] = False
                
            supabase.table("articulos_medidas").update(datos_medida).eq("id", item["articulo_medida_id"]).execute()
            
        supabase.table("lineas_pedido").insert(lineas).execute()

        supabase.table("carrito_items").delete().eq("carrito_id", carrito_id).execute()

        return {"exito": True, "referencia": referencia}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/pedidos/{pedido_id}")
def obtener_detalle_pedido(pedido_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        requester_id = user_auth.user.id

        db_requester = supabase.table("usuarios").select("rol").eq("id", requester_id).execute()
        es_admin = db_requester.data and db_requester.data[0].get("rol") in ["admin", "empleado"]

        consulta = supabase.table("pedidos").select(
            "id, referencia, fecha_pedido, estado, total, "
            "lineas_pedido(id, cantidad, cantidad_servida, precio_unitario, articulos_medidas(medida, articulos(nombre, imagen_url)))"
        ).eq("id", pedido_id)

        if not es_admin:
            consulta = consulta.eq("usuario_id", requester_id)

        resp_pedido = consulta.single().execute()

        if not resp_pedido.data:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        return resp_pedido.data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/articulos/{articulo_id}")
def actualizar_articulo(articulo_id: str, articulo: ArticuloModificar, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        import base64
        import uuid
        
        token = authorization.split(" ")[1]
        user_auth = supabase.auth.get_user(token)
        usuario_id = user_auth.user.id

        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores pueden editar artículos")

        datos_actualizar = {
            "nombre": articulo.nombre,
            "descripcion": articulo.descripcion,
            "categoria": articulo.categoria
        }

        if articulo.imagen_base64:
            base64_data = articulo.imagen_base64
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            
            image_bytes = base64.b64decode(base64_data)
            file_name = f"{uuid.uuid4()}.jpg"
            
            supabase.storage.from_("articulos").upload(file_name, image_bytes, {"content-type": "image/jpeg"})
            datos_actualizar["imagen_url"] = supabase.storage.from_("articulos").get_public_url(file_name)

        supabase.table("articulos").update(datos_actualizar).eq("id", articulo_id).execute()

        resp_medidas_actuales = supabase.table("articulos_medidas").select("id").eq("articulo_id", articulo_id).execute()
        ids_actuales = [m["id"] for m in resp_medidas_actuales.data]
        ids_recibidos = [m.id for m in articulo.medidas if m.id]

        ids_a_borrar = [id for id in ids_actuales if id not in ids_recibidos]
        if ids_a_borrar:
            supabase.table("articulos_medidas").delete().in_("id", ids_a_borrar).execute()

        for m in articulo.medidas:
            if m.precio < 0:
                raise HTTPException(status_code=400, detail="El precio no puede ser negativo")
            
            disponible_final = False if m.stock <= 0 else m.disponible

            datos_medida = {
                "articulo_id": articulo_id,
                "medida": m.medida,
                "precio": m.precio,
                "stock": m.stock,
                "disponible": disponible_final
            }
            if m.id:
                supabase.table("articulos_medidas").update(datos_medida).eq("id", m.id).execute()
            else:
                supabase.table("articulos_medidas").insert(datos_medida).execute()

        return {"exito": True, "mensaje": "Artículo actualizado correctamente"}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@api_router.post("/admin/usuarios")
def admin_crear_usuario(datos: AdminCrearUsuario, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id_admin = user_auth.user.id

        db_admin = supabase.table("usuarios").select("rol").eq("id", usuario_id_admin).execute()
        if not db_admin.data or db_admin.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Solo los administradores pueden crear usuarios")

        resp_auth = auth_client.auth.admin.create_user({
            "email": datos.correo,
            "password": datos.contrasena,
            "email_confirm": True,
            "user_metadata": {
                "nombre": datos.nombre,
                "apellidos": datos.apellidos,
                "telefono": datos.telefono
            }
        })
        
        nuevo_id = resp_auth.user.id

        supabase.table("usuarios").update({
            "rol": datos.rol.lower(),
            "nombre": datos.nombre,
            "apellidos": datos.apellidos,
            "telefono": datos.telefono
        }).eq("id", nuevo_id).execute()

        return {"exito": True, "mensaje": "Usuario creado correctamente"}

    except Exception as e:
        print(f"Error admin create user: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
@api_router.put("/admin/usuarios/{usuario_id}")
def admin_actualizar_perfil(usuario_id: str, datos: AdminActualizarUsuario, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id_admin = user_auth.user.id

        db_admin = supabase.table("usuarios").select("rol").eq("id", usuario_id_admin).execute()
        if not db_admin.data or db_admin.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Solo los administradores pueden editar usuarios")

        supabase.table("usuarios").update({
            "nombre": datos.nombre,
            "apellidos": datos.apellidos,
            "telefono": datos.telefono,
            "direccion": datos.direccion,
            "rol": datos.rol.lower()
        }).eq("id", usuario_id).execute()
        
        return {"exito": True, "mensaje": "Usuario actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/admin/usuarios/{usuario_id_borrar}")
def borrar_usuario(usuario_id_borrar: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id_admin = user_auth.user.id

        db_admin = supabase.table("usuarios").select("rol").eq("id", usuario_id_admin).execute()
        if not db_admin.data or db_admin.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores pueden borrar usuarios")

        supabase.table("usuarios").delete().eq("id", usuario_id_borrar).execute()
        
        auth_client.auth.admin.delete_user(usuario_id_borrar)
        
        return {"exito": True, "mensaje": "Usuario eliminado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/admin/pedidos")
def admin_obtener_pedidos(estado: Optional[str] = None, orden: str = "desc", referencia: Optional[str] = None, cliente: Optional[str] = None, rol: Optional[str] = None, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None, page: int = 1, limit: int = 20, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") not in ["admin", "empleado"]:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        consulta = supabase.table("pedidos").select("*, usuarios!inner(nombre, apellidos, rol)", count="exact")
        
        if estado and estado != "Todos":
            consulta = consulta.eq("estado", estado)
        if referencia:
            consulta = consulta.ilike("referencia", f"%{referencia}%")
        if rol and rol != "Todos":
            consulta = consulta.eq("usuarios.rol", rol.lower())
        if cliente:
            consulta = consulta.ilike("usuarios.nombre", f"%{cliente}%")
        if fecha_inicio:
            consulta = consulta.gte("fecha_pedido", fecha_inicio)
        if fecha_fin:
            consulta = consulta.lte("fecha_pedido", f"{fecha_fin}T23:59:59")
        
        consulta = consulta.order("fecha_pedido", desc=(orden == "desc"))
        
        start = (page - 1) * limit
        end = start + limit - 1
        respuesta = consulta.range(start, end).execute()
        
        total_pages = math.ceil(respuesta.count / limit) if respuesta.count else 0
        
        return {"data": respuesta.data, "total_pages": total_pages, "current_page": page}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/admin/pedidos/{pedido_id}/estado")
def admin_actualizar_estado_pedido(pedido_id: str, datos: AdminActualizarEstadoPedido, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") not in ["admin", "empleado"]:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        resp_pedido = supabase.table("pedidos").select("usuario_id, referencia").eq("id", pedido_id).execute()
        if not resp_pedido.data:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
            
        cliente_id = resp_pedido.data[0].get("usuario_id")
        referencia_pedido = resp_pedido.data[0].get("referencia", pedido_id)

        supabase.table("pedidos").update({"estado": datos.estado}).eq("id", pedido_id).execute()
        
        try:
            ahora_utc = datetime.now(timezone.utc).isoformat()
            
            nueva_notificacion = {
                "usuario_id": cliente_id,
                "pedido_id": pedido_id,
                "titulo": "Actualización de pedido",
                "mensaje": f"El pedido Nº{referencia_pedido} ha cambiado a estado: {datos.estado}.",
                "leida": False,
                "fecha_creacion": ahora_utc
            }
            supabase.table("notificaciones").insert(nueva_notificacion).execute()
        except Exception as e_notif:
            print(f"Error al crear notificación: {str(e_notif)}")

        return {"exito": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/admin/pedidos/{pedido_id}/lineas")
def admin_actualizar_lineas_pedido(pedido_id: str, datos: ActualizarLineasPedido, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") not in ["admin", "empleado"]:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        for linea in datos.lineas:
            supabase.table("lineas_pedido").update({
                "cantidad_servida": linea.preparados
            }).eq("id", linea.id).execute()

        return {"exito": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/articulos/{articulo_id}")
def eliminar_articulo(articulo_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar artículos")

        supabase.table("articulos").delete().eq("id", articulo_id).execute()
        return {"exito": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/notificaciones")
def obtener_notificaciones(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        resp_notif = supabase.table("notificaciones") \
            .select("*") \
            .eq("usuario_id", usuario_id) \
            .order("fecha_creacion", desc=True) \
            .execute()
            
        return resp_notif.data if resp_notif.data else []
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/notificaciones/marcar-leidas")
def marcar_notificaciones_leidas(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        supabase.table("notificaciones") \
            .update({"leida": True}) \
            .eq("usuario_id", usuario_id) \
            .eq("leida", False) \
            .execute()
            
        return {"exito": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/notificaciones/limpiar")
def limpiar_notificaciones(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        supabase.table("notificaciones").delete().eq("usuario_id", usuario_id).execute()
            
        return {"exito": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

app.include_router(api_router)