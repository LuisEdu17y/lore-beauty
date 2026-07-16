"""Rotas de agendamentos: criação pública e gestão pelo painel admin."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import exigir_admin
from database import get_session
from models import Agendamento, Atendimento, Cliente
from schemas import AgendamentoCreate, AgendamentoStatusUpdate

router = APIRouter()


@router.post("/api/agendamentos", response_model=Agendamento)
def criar_agendamento(dados: AgendamentoCreate, session: Session = Depends(get_session)):
    """Rota pública: cliente envia uma solicitação de agendamento pelo site."""
    agendamento = Agendamento(**dados.model_dump())
    session.add(agendamento)
    session.commit()
    session.refresh(agendamento)
    return agendamento


@router.get("/api/admin/agendamentos", response_model=list[Agendamento])
def listar_agendamentos(
    session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)
):
    agendamentos = session.exec(
        select(Agendamento).order_by(Agendamento.data_preferida.desc())
    ).all()
    return agendamentos


def _sincronizar_cliente_e_atendimento(agendamento: Agendamento, session: Session) -> None:
    """Ao marcar um agendamento como 'atendido': busca/cria o Cliente pelo WhatsApp
    e gera um Atendimento vinculado, mantendo o histórico sempre atualizado."""
    cliente = session.exec(
        select(Cliente).where(Cliente.whatsapp == agendamento.whatsapp)
    ).first()

    if cliente is None:
        cliente = Cliente(nome=agendamento.nome_cliente, whatsapp=agendamento.whatsapp)
        session.add(cliente)
        session.commit()
        session.refresh(cliente)

    atendimento = Atendimento(
        cliente_id=cliente.id,
        agendamento_origem_id=agendamento.id,
        servico=agendamento.servico,
        data=agendamento.data_preferida,
        observacoes=agendamento.observacoes,
    )
    session.add(atendimento)
    session.commit()


@router.patch("/api/admin/agendamentos/{agendamento_id}", response_model=Agendamento)
def atualizar_status_agendamento(
    agendamento_id: int,
    dados: AgendamentoStatusUpdate,
    session: Session = Depends(get_session),
    _admin: str = Depends(exigir_admin),
):
    agendamento = session.get(Agendamento, agendamento_id)
    if agendamento is None:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    agendamento.status = dados.status
    session.add(agendamento)
    session.commit()
    session.refresh(agendamento)

    if dados.status == "atendido":
        _sincronizar_cliente_e_atendimento(agendamento, session)
        session.refresh(agendamento)

    return agendamento
