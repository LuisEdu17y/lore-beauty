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

# Onde cada imagem do CMS pode ser usada pelo site
CATEGORIAS_IMAGEM_VALIDAS = ["hero", "carrossel", "galeria", "antes_depois", "banner"]


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


class Imagem(SQLModel, table=True):
    """Imagem gerenciável pelo CMS (painel Conteúdo > Galeria), usada em pontos do site
    conforme a categoria (hero, carrossel, galeria, antes_depois, banner).

    O arquivo em si fica no Cloudinary — aqui só ficam a URL pública e o public_id,
    necessário para excluir o arquivo de lá quando a imagem é removida.
    """

    id: int | None = Field(default=None, primary_key=True)
    titulo: str
    descricao: str | None = None
    url_imagem: str
    cloudinary_public_id: str
    categoria: str = Field(index=True)
    ordem_exibicao: int = Field(default=0)
    ativo: bool = Field(default=True)
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: datetime = Field(default_factory=datetime.utcnow)


class ConfiguracaoSite(SQLModel, table=True):
    """Linha única (id=1) com os textos livres do site, editáveis em Conteúdo > Textos."""

    id: int | None = Field(default=None, primary_key=True)
    texto_sobre: str | None = None
    texto_pos_procedimento: str | None = None
    endereco: str | None = None
    instagram_link: str | None = None
    mapa_embed_url: str | None = None
    atualizado_em: datetime = Field(default_factory=datetime.utcnow)


class Servico(SQLModel, table=True):
    """Serviço oferecido, exibido na seção Serviços da home. Gerenciável pelo painel."""

    id: int | None = Field(default=None, primary_key=True)
    titulo: str
    icone: str | None = None
    descricao: str
    duracao_preco: str | None = None
    ordem_exibicao: int = Field(default=0)
    ativo: bool = Field(default=True)
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: datetime = Field(default_factory=datetime.utcnow)


class Depoimento(SQLModel, table=True):
    """Depoimento de cliente, exibido na seção Depoimentos da home. Gerenciável pelo painel."""

    id: int | None = Field(default=None, primary_key=True)
    autor: str
    texto: str
    estrelas: int = Field(default=5)
    ordem_exibicao: int = Field(default=0)
    ativo: bool = Field(default=True)
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: datetime = Field(default_factory=datetime.utcnow)
