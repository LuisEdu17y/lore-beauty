"""Autenticação do painel admin: usuário único, senha com bcrypt, sessão via JWT em cookie httpOnly."""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Cookie, HTTPException, status

# Em produção, defina estas variáveis de ambiente com valores próprios.
# [PLACEHOLDER: gerar um SECRET_KEY forte e definir via variável de ambiente antes do deploy]
SECRET_KEY = os.environ.get("LORE_SECRET_KEY", "chave-secreta-de-desenvolvimento-trocar-em-producao")
ALGORITHM = "HS256"
EXPIRACAO_MINUTOS = 60 * 8  # 8 horas de sessão

# Credenciais únicas do admin (a Lore). Definidas via variável de ambiente.
# [PLACEHOLDER: definir ADMIN_USUARIO e ADMIN_SENHA_HASH reais antes de usar em produção]
ADMIN_USUARIO = os.environ.get("LORE_ADMIN_USUARIO", "lore")


def _gerar_hash_senha_padrao() -> str:
    """Gera o hash da senha padrão de desenvolvimento (troque via variável de ambiente)."""
    senha_padrao = os.environ.get("LORE_ADMIN_SENHA", "troque-esta-senha")
    return bcrypt.hashpw(senha_padrao.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


ADMIN_SENHA_HASH = os.environ.get("LORE_ADMIN_SENHA_HASH") or _gerar_hash_senha_padrao()


def verificar_senha(senha_texto_plano: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha_texto_plano.encode("utf-8"), senha_hash.encode("utf-8"))


def autenticar_admin(usuario: str, senha: str) -> bool:
    return usuario == ADMIN_USUARIO and verificar_senha(senha, ADMIN_SENHA_HASH)


def criar_token_acesso() -> str:
    expira_em = datetime.now(timezone.utc) + timedelta(minutes=EXPIRACAO_MINUTOS)
    payload = {"sub": ADMIN_USUARIO, "exp": expira_em}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def exigir_admin(access_token: str | None = Cookie(default=None)):
    """Dependency do FastAPI: valida o JWT do cookie httpOnly em rotas protegidas."""
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autenticado")
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida ou expirada")
    return payload["sub"]
