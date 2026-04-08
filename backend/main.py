import os
from datetime import datetime, timezone
from typing import Optional, Dict, List  # Añadimos Dict y List aquí
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from itertools import groupby  # Añadimos esta importación para agrupar las categorías

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
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
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