"""Conexão com o banco SQLite via SQLModel."""
import os

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine, select

load_dotenv()

# Em produção (Railway), aponte para o caminho de um volume persistente, ex:
# LORE_DATABASE_URL=sqlite:////data/lore.db — sem isso, o banco é apagado a cada deploy.
DATABASE_URL = os.environ.get("LORE_DATABASE_URL", "sqlite:///./lore.db")

# check_same_thread=False necessário porque o SQLite é acessado por múltiplas
# requisições do FastAPI, que podem rodar em threads diferentes
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SERVICOS_PADRAO = [
    {
        "titulo": "Cílios em Tela",
        "icone": "✨",
        "descricao": "Fios tecnológicos aplicados com técnica leve, para um olhar marcante sem pesar.",
    },
    {
        "titulo": "Brow Lamination",
        "icone": "🪞",
        "descricao": "Alinhamento e modelagem dos fios da sobrancelha para um efeito preenchido e natural.",
    },
    {
        "titulo": "Design de Sobrancelha",
        "icone": "🖌️",
        "descricao": "Modelagem sob medida para valorizar o formato do seu rosto.",
    },
    {
        "titulo": "Buço",
        "icone": "🌸",
        "descricao": "Remoção cuidadosa e precisa, com conforto do início ao fim.",
    },
    {
        "titulo": "Atendimento Masculino",
        "icone": "🧔",
        "descricao": "Design de sobrancelha pensado para o público masculino.",
    },
]


def criar_banco_e_tabelas():
    SQLModel.metadata.create_all(engine)


def seed_servicos_padrao():
    """Popula a tabela Servico com os serviços padrão na primeira execução —
    não roda de novo se a Lore já tiver mexido na lista (tabela não estará vazia)."""
    from models import Servico

    with Session(engine) as session:
        ja_existe_algum = session.exec(select(Servico)).first()
        if ja_existe_algum is not None:
            return

        for ordem, dados in enumerate(SERVICOS_PADRAO):
            session.add(Servico(ordem_exibicao=ordem, **dados))
        session.commit()


def get_session():
    with Session(engine) as session:
        yield session
