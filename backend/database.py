import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# SQLite file backend folder me ban jaayegi
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./salarite.db")

# check_same_thread=False: FastAPI multiple threads use karta hai
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """Har request ko apna DB session milta hai, kaam ke baad band ho jaata hai."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
