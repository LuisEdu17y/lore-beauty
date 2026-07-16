"""Rota de login do painel admin."""
from fastapi import APIRouter, HTTPException, Response

from auth import EXPIRACAO_MINUTOS, autenticar_admin, criar_token_acesso
from schemas import LoginRequest

router = APIRouter()


@router.post("/api/admin/login")
def login(dados: LoginRequest, response: Response):
    if not autenticar_admin(dados.usuario, dados.senha):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    token = criar_token_acesso()
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=EXPIRACAO_MINUTOS * 60,
    )
    return {"mensagem": "Login realizado com sucesso"}


@router.post("/api/admin/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"mensagem": "Logout realizado"}
