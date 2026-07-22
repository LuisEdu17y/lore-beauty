"""Rotas do CMS de imagens: upload/gestão pelo painel admin e leitura pública
que a landing page consome (ex: foto do Hero)."""
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from auth import exigir_admin
from database import get_session
from models import CATEGORIAS_IMAGEM_VALIDAS, Imagem
from schemas import ImagemOut, ImagemPublicOut, ImagemUpdate
from storage import enviar_imagem, remover_imagem

router = APIRouter()


def _validar_categoria(categoria: str) -> None:
    if categoria not in CATEGORIAS_IMAGEM_VALIDAS:
        raise HTTPException(
            status_code=422,
            detail=f"Categoria inválida. Opções: {', '.join(CATEGORIAS_IMAGEM_VALIDAS)}",
        )


@router.get("/api/imagens", response_model=list[ImagemPublicOut])
def listar_imagens_publicas(categoria: str, session: Session = Depends(get_session)):
    """Rota pública: o site busca aqui as imagens ativas de uma categoria (ex: hero)."""
    imagens = session.exec(
        select(Imagem)
        .where(Imagem.categoria == categoria, Imagem.ativo == True)  # noqa: E712
        .order_by(Imagem.ordem_exibicao)
    ).all()
    return imagens


@router.get("/api/admin/imagens", response_model=list[ImagemOut])
def listar_imagens(session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)):
    imagens = session.exec(
        select(Imagem).order_by(Imagem.categoria, Imagem.ordem_exibicao)
    ).all()
    return imagens


@router.post("/api/admin/imagens", response_model=ImagemOut)
async def criar_imagem(
    titulo: str = Form(...),
    categoria: str = Form(...),
    descricao: str | None = Form(None),
    ordem_exibicao: int = Form(0),
    arquivo: UploadFile = File(...),
    session: Session = Depends(get_session),
    _admin: str = Depends(exigir_admin),
):
    _validar_categoria(categoria)

    conteudo = await arquivo.read()
    url_imagem, public_id = enviar_imagem(conteudo)

    imagem = Imagem(
        titulo=titulo,
        descricao=descricao,
        url_imagem=url_imagem,
        cloudinary_public_id=public_id,
        categoria=categoria,
        ordem_exibicao=ordem_exibicao,
    )
    session.add(imagem)
    session.commit()
    session.refresh(imagem)
    return imagem


@router.patch("/api/admin/imagens/{imagem_id}", response_model=ImagemOut)
def atualizar_imagem(
    imagem_id: int,
    dados: ImagemUpdate,
    session: Session = Depends(get_session),
    _admin: str = Depends(exigir_admin),
):
    imagem = session.get(Imagem, imagem_id)
    if imagem is None:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(imagem, campo, valor)
    imagem.atualizado_em = datetime.utcnow()

    session.add(imagem)
    session.commit()
    session.refresh(imagem)
    return imagem


@router.delete("/api/admin/imagens/{imagem_id}", status_code=204)
def excluir_imagem(
    imagem_id: int, session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)
):
    imagem = session.get(Imagem, imagem_id)
    if imagem is None:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")

    remover_imagem(imagem.cloudinary_public_id)
    session.delete(imagem)
    session.commit()
