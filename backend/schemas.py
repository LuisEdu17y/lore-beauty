"""Schemas Pydantic usados na fronteira da API (entrada/saída), separados dos models de tabela."""
from datetime import date, datetime

from pydantic import BaseModel, field_validator

from models import CATEGORIAS_IMAGEM_VALIDAS, SERVICOS_VALIDOS, STATUS_VALIDOS


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


class ImagemUpdate(BaseModel):
    """Payload para editar metadados de uma imagem (não permite trocar o arquivo)."""

    titulo: str | None = None
    descricao: str | None = None
    categoria: str | None = None
    ordem_exibicao: int | None = None
    ativo: bool | None = None

    @field_validator("categoria")
    @classmethod
    def validar_categoria(cls, valor: str | None) -> str | None:
        if valor is not None and valor not in CATEGORIAS_IMAGEM_VALIDAS:
            raise ValueError(f"Categoria inválida. Opções: {', '.join(CATEGORIAS_IMAGEM_VALIDAS)}")
        return valor


class ImagemOut(BaseModel):
    """Retorno completo, usado no painel admin."""

    id: int
    titulo: str
    descricao: str | None
    url_imagem: str
    categoria: str
    ordem_exibicao: int
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class ImagemPublicOut(BaseModel):
    """Retorno enxuto, usado pela rota pública que a landing page consome."""

    id: int
    titulo: str
    descricao: str | None
    url_imagem: str
    categoria: str
    ordem_exibicao: int

    model_config = {"from_attributes": True}


class ConfiguracaoSiteUpdate(BaseModel):
    """Payload para editar os textos livres do site (Conteúdo > Textos)."""

    texto_sobre: str | None = None
    texto_pos_procedimento: str | None = None
    endereco: str | None = None
    instagram_link: str | None = None
    mapa_embed_url: str | None = None


class ConfiguracaoSiteOut(BaseModel):
    texto_sobre: str | None
    texto_pos_procedimento: str | None
    endereco: str | None
    instagram_link: str | None
    mapa_embed_url: str | None

    model_config = {"from_attributes": True}


class ServicoCreate(BaseModel):
    """Payload para cadastrar um serviço (painel admin)."""

    titulo: str
    icone: str | None = None
    descricao: str
    duracao_preco: str | None = None
    ordem_exibicao: int = 0


class ServicoUpdate(BaseModel):
    titulo: str | None = None
    icone: str | None = None
    descricao: str | None = None
    duracao_preco: str | None = None
    ordem_exibicao: int | None = None
    ativo: bool | None = None


class ServicoOut(BaseModel):
    id: int
    titulo: str
    icone: str | None
    descricao: str
    duracao_preco: str | None
    ordem_exibicao: int
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class DepoimentoCreate(BaseModel):
    """Payload para cadastrar um depoimento (painel admin)."""

    autor: str
    texto: str
    estrelas: int = 5
    ordem_exibicao: int = 0

    @field_validator("estrelas")
    @classmethod
    def validar_estrelas(cls, valor: int) -> int:
        if not 1 <= valor <= 5:
            raise ValueError("Estrelas deve ser um valor entre 1 e 5")
        return valor


class DepoimentoUpdate(BaseModel):
    autor: str | None = None
    texto: str | None = None
    estrelas: int | None = None
    ordem_exibicao: int | None = None
    ativo: bool | None = None

    @field_validator("estrelas")
    @classmethod
    def validar_estrelas(cls, valor: int | None) -> int | None:
        if valor is not None and not 1 <= valor <= 5:
            raise ValueError("Estrelas deve ser um valor entre 1 e 5")
        return valor


class DepoimentoOut(BaseModel):
    id: int
    autor: str
    texto: str
    estrelas: int
    ordem_exibicao: int
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = {"from_attributes": True}
