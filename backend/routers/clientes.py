"""Rotas de clientes — ficha e histórico, acessíveis só pelo painel admin (dados pessoais/LGPD)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import exigir_admin
from database import get_session
from models import Atendimento, Cliente
from schemas import ClienteDetalheOut, ClienteObservacoesUpdate, ClienteOut

router = APIRouter()


@router.get("/api/admin/clientes", response_model=list[ClienteOut])
def listar_clientes(session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)):
    clientes = session.exec(select(Cliente).order_by(Cliente.nome)).all()

    resultado = []
    for cliente in clientes:
        ultimo = session.exec(
            select(Atendimento)
            .where(Atendimento.cliente_id == cliente.id)
            .order_by(Atendimento.data.desc())
        ).first()
        resultado.append(
            ClienteOut(
                id=cliente.id,
                nome=cliente.nome,
                whatsapp=cliente.whatsapp,
                observacoes_gerais=cliente.observacoes_gerais,
                criado_em=cliente.criado_em,
                ultimo_atendimento=ultimo.data if ultimo else None,
            )
        )
    return resultado


@router.get("/api/admin/clientes/{cliente_id}", response_model=ClienteDetalheOut)
def obter_ficha_cliente(
    cliente_id: int, session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)
):
    cliente = session.get(Cliente, cliente_id)
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    atendimentos = session.exec(
        select(Atendimento)
        .where(Atendimento.cliente_id == cliente_id)
        .order_by(Atendimento.data.desc())
    ).all()

    return ClienteDetalheOut(
        id=cliente.id,
        nome=cliente.nome,
        whatsapp=cliente.whatsapp,
        observacoes_gerais=cliente.observacoes_gerais,
        criado_em=cliente.criado_em,
        atendimentos=atendimentos,
    )


@router.patch("/api/admin/clientes/{cliente_id}", response_model=ClienteOut)
def atualizar_observacoes_cliente(
    cliente_id: int,
    dados: ClienteObservacoesUpdate,
    session: Session = Depends(get_session),
    _admin: str = Depends(exigir_admin),
):
    cliente = session.get(Cliente, cliente_id)
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    cliente.observacoes_gerais = dados.observacoes_gerais
    session.add(cliente)
    session.commit()
    session.refresh(cliente)

    ultimo = session.exec(
        select(Atendimento)
        .where(Atendimento.cliente_id == cliente.id)
        .order_by(Atendimento.data.desc())
    ).first()

    return ClienteOut(
        id=cliente.id,
        nome=cliente.nome,
        whatsapp=cliente.whatsapp,
        observacoes_gerais=cliente.observacoes_gerais,
        criado_em=cliente.criado_em,
        ultimo_atendimento=ultimo.data if ultimo else None,
    )
