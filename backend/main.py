import os
from datetime import datetime, timezone
from typing import Optional, Dict, List
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from itertools import groupby

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

class ArticuloCrear(BaseModel):
    nombre: str
    descripcion: str
    categoria: str
    imagen_base64: Optional[str] = None
    medidas: List[MedidaCrear]
    
class MedidaModificar(BaseModel):
    id: Optional[str] = None 
    medida: str
    precio: float
    stock: int

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

@app.get("/")
def read_root():
    return {"mensaje": "API de Domitex funcionando correctamente 🚀"}

@app.post("/usuarios")
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

@app.post("/login")
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

@app.get("/usuarios")
def obtener_todos_usuarios(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        token = authorization.split(" ")[1]
        user_auth = supabase.auth.get_user(token)
        usuario_id = user_auth.user.id
        
        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores pueden ver los usuarios")
            
        respuesta = supabase.table("usuarios").select("id, nombre, apellidos, rol, ultimo_acceso").execute()
        return respuesta.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/usuarios/{usuario_id}")
def obtener_perfil(usuario_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        requester_auth = auth_client.auth.get_user(token)
        requester_id = requester_auth.user.id

        # 1. Obtener datos de la tabla pública
        respuesta = supabase.table("usuarios").select("*").eq("id", usuario_id).execute()
        if not respuesta.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        datos_perfil = respuesta.data[0]

        # 2. Verificar permisos para ver el correo (Eres tú mismo o eres Admin)
        # Consultamos el rol del que solicita
        db_requester = supabase.table("usuarios").select("rol").eq("id", requester_id).execute()
        es_admin = db_requester.data and db_requester.data[0].get("rol") == "admin"

        if requester_id == usuario_id or es_admin:
            # Usamos el cliente admin para sacar el correo real del usuario solicitado
            target_user = auth_client.auth.admin.get_user_by_id(usuario_id)
            datos_perfil["correo"] = target_user.user.email
                
        return datos_perfil
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/pedidos/historial")
def obtener_historial_pedidos(usuario_id: Optional[str] = None, authorization: str = Header(None)):
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

        resp_pedidos = supabase.table("pedidos") \
            .select("id, referencia, fecha_pedido, estado, total") \
            .eq("usuario_id", target_id) \
            .order("fecha_pedido", desc=True) \
            .execute()
            
        return resp_pedidos.data if resp_pedidos.data else []
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

@app.delete("/usuarios/{id_borrar}")
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

@app.put("/usuarios/{usuario_id}/contrasena")
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

@app.get("/categorias")
def obtener_categorias():
    try:
        respuesta = supabase.table("categorias").select("*").order("nombre").execute()
        return respuesta.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/categorias")
def crear_categoria(categoria: CategoriaCrear, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        resp = supabase.table("categorias").insert({"nombre": categoria.nombre}).execute()
        return resp.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/articulos", response_model=Dict[str, List[ArticuloResponse]])
def obtener_catalogo_agrupado():
    try:
        respuesta = supabase.table("articulos").select("id, nombre, imagen_url, categoria, categorias(nombre)").execute()
        
        if not respuesta.data:
            return {}

        datos_procesados = []
        for item in respuesta.data:
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
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        requester_id = user_auth.user.id

        db_requester = supabase.table("usuarios").select("rol").eq("id", requester_id).execute()
        es_admin = db_requester.data and db_requester.data[0].get("rol") == "admin"

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

@app.put("/articulos/{articulo_id}")
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
            datos_medida = {
                "articulo_id": articulo_id,
                "medida": m.medida,
                "precio": m.precio,
                "stock": m.stock,
                "disponible": True
            }
            if m.id:
                supabase.table("articulos_medidas").update(datos_medida).eq("id", m.id).execute()
            else:
                supabase.table("articulos_medidas").insert(datos_medida).execute()

        return {"exito": True, "mensaje": "Artículo actualizado correctamente"}

    except Exception as e:
        print(f"Error PUT actualizar articulo: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
@app.post("/admin/usuarios")
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
    
@app.put("/admin/usuarios/{usuario_id}")
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

@app.delete("/admin/usuarios/{usuario_id_borrar}")
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

@app.get("/admin/pedidos")
def admin_obtener_pedidos(estado: Optional[str] = None, orden: str = "desc", authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado")

        consulta = supabase.table("pedidos").select("*, usuarios(nombre, apellidos)")
        
        if estado and estado != "Todos":
            consulta = consulta.eq("estado", estado)
        
        consulta = consulta.order("fecha_pedido", desc=(orden == "desc"))
        
        respuesta = consulta.execute()
        return respuesta.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/admin/pedidos/{pedido_id}/estado")
def admin_actualizar_estado_pedido(pedido_id: str, datos: AdminActualizarEstadoPedido, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado")

        supabase.table("pedidos").update({"estado": datos.estado}).eq("id", pedido_id).execute()
        return {"exito": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/admin/pedidos/{pedido_id}/lineas")
def admin_actualizar_lineas_pedido(pedido_id: str, datos: ActualizarLineasPedido, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.split(" ")[1]
        auth_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_auth = auth_client.auth.get_user(token)
        usuario_id = user_auth.user.id

        db_user = supabase.table("usuarios").select("rol").eq("id", usuario_id).execute()
        if not db_user.data or db_user.data[0].get("rol") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado")

        for linea in datos.lineas:
            supabase.table("lineas_pedido").update({
                "cantidad_servida": linea.preparados
            }).eq("id", linea.id).execute()

        return {"exito": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))