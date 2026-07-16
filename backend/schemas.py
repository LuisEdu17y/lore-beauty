"""Schemas Pydantic usados na fronteira da API (entrada/saída), separados dos models de tabela."""
from datetime import date, datetime

from pydantic import BaseModel, field_validator

from models import SERVICOS_VALIDOS, STATUS_VALIDOS


class AgendamentoCreate(BaseModel):
    """Payload aceito no formulário público de agendamento."""

    nome_cliente: str
    whatsapp: str
    servico: str
    data_preferida: date
    horario_preferido: str
    observacoes: str | None = None

    @field_validator("servico")
    @classmethod
    def validar_servico(cls, valor: str) -> str:
        if valor not in SERVICOS_VALIDOS:
            raise ValueError(f"Serviço inválido. Opções: {', '.join(SERVICOS_VALIDOS)}")
        return valor

    @field_validator("nome_cliente")
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        if not valor.strip():
            raise ValueError("Nome não pode ser vazio")
        return valor.strip()

    @field_validator("whatsapp")
    @classmethod
    def validar_whatsapp(cls, valor: str) -> str:
        digitos = "".join(filter(str.isdigit, valor))
        if len(digitos) < 10:
            raise ValueError("WhatsApp inválido")
        return valor.strip()


class AgendamentoStatusUpdate(BaseModel):
    """Payload para atualizar o status de uma solicitação (painel admin)."""

    status: str

    @field_validator("status")
    @classmethod
    def validar_status(cls, valor: str) -> str:
        if valor not in STATUS_VALIDOS:
            raise ValueError(f"Status inválido. Opções: {', '.join(STATUS_VALIDOS)}")
        return valor


class ClienteObservacoesUpdate(BaseModel):
    """Payload para atualizar as observações gerais de um cliente (painel admin)."""

    observacoes_gerais: str | None = None


class LoginRequest(BaseModel):
    usuario: str
    senha: str


class AtendimentoOut(BaseModel):
    id: int
    servico: str
    data: date
    observacoes: str | None
    criado_em: datetime

    model_config = {"from_attributes": True}


class ClienteOut(BaseModel):
    id: int
    nome: str
    whatsapp: str
    observacoes_gerais: str | None
    criado_em: datetime
    ultimo_atendimento: date | None = None

    model_config = {"from_attributes": True}


class ClienteDetalheOut(BaseModel):
    id: int
    nome: str
    whatsapp: str
    observacoes_gerais: str | None
    criado_em: datetime
    atendimentos: list[AtendimentoOut]

    model_config = {"from_attributes": True}
