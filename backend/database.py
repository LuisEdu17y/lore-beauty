"""Conexão com o banco SQLite via SQLModel."""
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = "sqlite:///./lore.db"

# check_same_thread=False necessário porque o SQLite é acessado por múltiplas
# requisições do FastAPI, que podem rodar em threads diferentes
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def criar_banco_e_tabelas():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
