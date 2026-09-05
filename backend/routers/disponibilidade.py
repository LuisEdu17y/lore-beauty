"""Rotas de disponibilidade: configuração da agenda no painel e consulta pública.

Segue o mesmo padrão de routers/conteudo.py — rota pública sem auth para o que o
formulário de agendamento consome, rotas /api/admin/... protegidas por exigir_admin.
A regra de negócio em si mora em horarios.py, compartilhada com routers/agendamentos.py.
"""
from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from auth import exigir_admin
from database import get_session
from horarios import formatar_hora, horarios_livres, obter_configuracao
from models import DIAS_SEMANA, Disponibilidade
from schemas import DisponibilidadeDiaOut, DisponibilidadeUpdate, HorariosDisponiveisOut

router = APIRouter()


def _para_saida(registro: Disponibilidade) -> DisponibilidadeDiaOut:
    return DisponibilidadeDiaOut(
        dia_semana=registro.dia_semana,
        rotulo=DIAS_SEMANA[registro.dia_semana],
        ativo=registro.ativo,
        hora_inicio=formatar_hora(registro.hora_inicio),
        hora_fim=formatar_hora(registro.hora_fim),
    )


# ---------- Painel administrativo ----------
@router.get("/api/admin/disponibilidade", response_model=list[DisponibilidadeDiaOut])
def obter_disponibilidade(
    session: Session = Depends(get_session), _admin: str = Depends(exigir_admin)
):
    """Configuração atual dos 7 dias, sempre na ordem segunda → domingo."""
    return [_para_saida(registro) for registro in obter_configuracao(session)]


@router.put("/api/admin/disponibilidade", response_model=list[DisponibilidadeDiaOut])
def salvar_disponibilidade(
    dados: DisponibilidadeUpdate,
    session: Session = Depends(get_session),
    _admin: str = Depends(exigir_admin),
):
    """Substitui a configuração da semana inteira pelo que veio do painel."""
    registros = {registro.dia_semana: registro for registro in obter_configuracao(session)}

    for dia in dados.dias:
        registro = registros[dia.dia_semana]
        registro.ativo = dia.ativo
        registro.hora_inicio = dia.hora_inicio
        registro.hora_fim = dia.hora_fim
        registro.atualizado_em = datetime.utcnow()
        session.add(registro)

    session.commit()
    for registro in registros.values():
        session.refresh(registro)

    return [_para_saida(registros[dia]) for dia in range(len(DIAS_SEMANA))]


# ---------- Rota pública ----------
@router.get("/api/disponibilidade", response_model=HorariosDisponiveisOut)
def horarios_da_data(
    data: date = Query(..., description="Data no formato YYYY-MM-DD"),
    session: Session = Depends(get_session),
):
    """Horários livres de uma data. Nunca expõe dado de cliente — só a lista de horários."""
    return HorariosDisponiveisOut(data=data, horarios=horarios_livres(session, data))