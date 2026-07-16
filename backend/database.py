"""Conexão com o banco SQLite via SQLModel."""
import os

from sqlmodel import Session, SQLModel, create_engine

# Em produção (Railway), aponte para o caminho de um volume persistente, ex:
# LORE_DATABASE_URL=sqlite:////data/lore.db — sem isso, o banco é apagado a cada deploy.
DATABASE_URL = os.environ.get("LORE_DATABASE_URL", "sqlite:///./lore.db")

# check_same_thread=False necessário porque o SQLite é acessado por múltiplas
# requisições do FastAPI, que podem rodar em threads diferentes
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def criar_banco_e_tabelas():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
