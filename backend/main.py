"""Ponto de entrada da aplicação: FastAPI servindo a API e o frontend estático."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import criar_banco_e_tabelas
from routers import admin, agendamentos, clientes

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="LORE - Cílios em Tela & Sobrancelha")


@app.on_event("startup")
def ao_iniciar():
    criar_banco_e_tabelas()


# Rotas da API
app.include_router(agendamentos.router)
app.include_router(clientes.router)
app.include_router(admin.router)

# Arquivos estáticos (css, js, imagens)
app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")
app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")


# Páginas HTML (sem build step — servidas diretamente)
@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/agendamento")
def pagina_agendamento():
    return FileResponse(FRONTEND_DIR / "agendamento.html")


@app.get("/admin/login")
def pagina_admin_login():
    return FileResponse(FRONTEND_DIR / "admin" / "login.html")


@app.get("/admin/painel")
def pagina_admin_painel():
    return FileResponse(FRONTEND_DIR / "admin" / "painel.html")
