import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

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

class RegistroUsuario(BaseModel):
    correo: str
    contrasena: str
    nombre: str
    apellidos: str
    telefono: str

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