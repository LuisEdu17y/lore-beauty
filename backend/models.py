"""Modelos de dados (SQLModel) do site da Lore."""
from datetime import date, datetime

from sqlmodel import Field, SQLModel

# Serviços oferecidos — usado como enum "solto" (string) nos models e no frontend
SERVICOS_VALIDOS = [
    "cilios_tela",
    "brow_lamination",
    "design_sobrancelha",
    "buco",
    "masculino",
]

STATUS_VALIDOS = ["pendente", "confirmado", "atendido", "cancelado"]


class Agendamento(SQLModel, table=True):
    """Solicitação recebida pelo formulário público — representa o funil de agendamento."""

    id: int | None = Field(default=None, primary_key=True)
    nome_cliente: str
    whatsapp: str
    servico: str
    data_preferida: date
    horario_preferido: str
    observacoes: str | None = None
    status: str = Field(default="pendente")
    criado_em: datetime = Field(default_factory=datetime.utcnow)


class Cliente(SQLModel, table=True):
    """Ficha da cliente — histórico consolidado, visível só no painel admin.

    Contém dados pessoais e pode conter observações de saúde (categoria sensível
    pela LGPD) — nunca expor em rota pública nem logar em texto plano.
    """

    id: int | None = Field(default=None, primary_key=True)
    nome: str
    whatsapp: str = Field(unique=True, index=True)
    observacoes_gerais: str | None = None
    criado_em: datetime = Field(default_factory=datetime.utcnow)


class Atendimento(SQLModel, table=True):
    """Registro de cada atendimento já realizado, vinculado a um cliente."""

    id: int | None = Field(default=None, primary_key=True)
    cliente_id: int = Field(foreign_key="cliente.id")
    agendamento_origem_id: int | None = Field(default=None, foreign_key="agendamento.id")
    servico: str
    data: date
    observacoes: str | None = None
    criado_em: datetime = Field(default_factory=datetime.utcnow)
