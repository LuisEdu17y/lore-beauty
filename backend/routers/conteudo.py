"""Rotas do CMS de conteúdo textual: configuração do site, serviços e depoimentos.
Segue o mesmo padrão de routers/imagens.py — rota pública sem auth para o que a
landing page consome, rotas /api/admin/... protegidas para o painel."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import exigir_admin
from database import get_session
from models import ConfiguracaoSite, Depoimento, Servico
from schemas import (
    ConfiguracaoSiteOut,
    ConfiguracaoSiteUpdate,
    DepoimentoCreate,
    DepoimentoOut,
    DepoimentoUpdate,
    ServicoCreate,
    ServicoOut,
    ServicoUpdate,
)

router = APIRouter()


def _obter_ou_criar_configuracao(session: Session) -> ConfiguracaoSite:
    configuracao = session.get(ConfiguracaoSite, 1)
    if configuracao is None:
        configuracao = ConfiguracaoSite(id=1)
        session.add(configuracao)
        session.commit()
        session.refresh(configuracao)
    return configuracao


# ---------- Configuração do site ----------
@router.get("/api/configuracao", response_model=ConfiguracaoSiteOut)
def obter_configuracao_publica(session: Session = Depends(get_session)):
    return _obter_ou_criar_configuracao(session)


@router.get("/api/admin/configuracao", response_model=ConfiguracaoSiteOut)
def obter_configuracao(session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)):
    return _obter_ou_criar_configuracao(session)


@router.patch("/api/admin/configuracao", response_model=ConfiguracaoSiteOut)
def atualizar_configuracao(
    dados: ConfiguracaoSiteUpdate,
    session: Session = Depends(get_session),
    _admin: str = Depends(exigir_admin),
):
    configuracao = _obter_ou_criar_configuracao(session)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(configuracao, campo, valor)
    configuracao.atualizado_em = datetime.utcnow()

    session.add(configuracao)
    session.commit()
    session.refresh(configuracao)
    return configuracao


# ---------- Serviços ----------
@router.get("/api/servicos", response_model=list[ServicoOut])
def listar_servicos_publicos(session: Session = Depends(get_session)):
    return session.exec(
        select(Servico).where(Servico.ativo == True).order_by(Servico.ordem_exibicao)  # noqa: E712
    ).all()


@router.get("/api/admin/servicos", response_model=list[ServicoOut])
def listar_servicos(session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)):
    return session.exec(select(Servico).order_by(Servico.ordem_exibicao)).all()


@router.post("/api/admin/servicos", response_model=ServicoOut)
def criar_servico(
    dados: ServicoCreate, session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)
):
    servico = Servico(**dados.model_dump())
    session.add(servico)
    session.commit()
    session.refresh(servico)
    return servico


@router.patch("/api/admin/servicos/{servico_id}", response_model=ServicoOut)
def atualizar_servico(
    servico_id: int,
    dados: ServicoUpdate,
    session: Session = Depends(get_session),
    _admin: str = Depends(exigir_admin),
):
    servico = session.get(Servico, servico_id)
    if servico is None:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(servico, campo, valor)
    servico.atualizado_em = datetime.utcnow()

    session.add(servico)
    session.commit()
    session.refresh(servico)
    return servico


@router.delete("/api/admin/servicos/{servico_id}", status_code=204)
def excluir_servico(
    servico_id: int, session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)
):
    servico = session.get(Servico, servico_id)
    if servico is None:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    session.delete(servico)
    session.commit()


# ---------- Depoimentos ----------
@router.get("/api/depoimentos", response_model=list[DepoimentoOut])
def listar_depoimentos_publicos(session: Session = Depends(get_session)):
    return session.exec(
        select(Depoimento).where(Depoimento.ativo == True).order_by(Depoimento.ordem_exibicao)  # noqa: E712
    ).all()


@router.get("/api/admin/depoimentos", response_model=list[DepoimentoOut])
def listar_depoimentos(session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)):
    return session.exec(select(Depoimento).order_by(Depoimento.ordem_exibicao)).all()


@router.post("/api/admin/depoimentos", response_model=DepoimentoOut)
def criar_depoimento(
    dados: DepoimentoCreate, session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)
):
    depoimento = Depoimento(**dados.model_dump())
    session.add(depoimento)
    session.commit()
    session.refresh(depoimento)
    return depoimento


@router.patch("/api/admin/depoimentos/{depoimento_id}", response_model=DepoimentoOut)
def atualizar_depoimento(
    depoimento_id: int,
    dados: DepoimentoUpdate,
    session: Session = Depends(get_session),
    _admin: str = Depends(exigir_admin),
):
    depoimento = session.get(Depoimento, depoimento_id)
    if depoimento is None:
        raise HTTPException(status_code=404, detail="Depoimento não encontrado")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(depoimento, campo, valor)
    depoimento.atualizado_em = datetime.utcnow()

    session.add(depoimento)
    session.commit()
    session.refresh(depoimento)
    return depoimento


@router.delete("/api/admin/depoimentos/{depoimento_id}", status_code=204)
def excluir_depoimento(
    depoimento_id: int, session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)
):
    depoimento = session.get(Depoimento, depoimento_id)
    if depoimento is None:
        raise HTTPException(status_code=404, detail="Depoimento não encontrado")

    session.delete(depoimento)
    session.commit()
