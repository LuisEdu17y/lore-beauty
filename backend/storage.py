"""Armazenamento de imagens via Cloudinary.

Isolado num módulo próprio para que o resto do app não dependa diretamente do
provedor escolhido — trocar para S3/Supabase no futuro só mexe aqui.
"""
import os
import uuid

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True,
)

PASTA_CLOUDINARY = "lore-beauty"


def enviar_imagem(conteudo: bytes) -> tuple[str, str]:
    """Envia os bytes de uma imagem para o Cloudinary.

    Retorna (url_segura, public_id) — public_id é guardado no banco para permitir
    excluir o arquivo de lá quando o registro for removido.
    """
    resultado = cloudinary.uploader.upload(
        conteudo,
        folder=PASTA_CLOUDINARY,
        public_id=uuid.uuid4().hex,
    )
    return resultado["secure_url"], resultado["public_id"]


def remover_imagem(public_id: str) -> None:
    cloudinary.uploader.destroy(public_id)
