import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import hash_password
from sqlalchemy import inspect, text

from database import Base, SessionLocal, engine
from models import User
from routers import auth_routes, interviews, tasks, users

Base.metadata.create_all(bind=engine)


def add_missing_columns():
    """Purani salarite.db me naye columns jodta hai. Koi data delete nahi hota.
    Purane interviews ka employer khali rehta hai, isliye employer ko wo nahi dikhte."""
    insp = inspect(engine)
    ref = "INTEGER REFERENCES users(id)"
    needed = {
        "tasks": [("created_by_id", ref), ("assigned_to_id", ref), ("assigned_at", "DATETIME")],
        "interviews": [("created_by_id", ref), ("employer_id", ref), ("ends_at", "DATETIME")],
    }
    with engine.begin() as conn:
        for table, columns in needed.items():
            if not insp.has_table(table):
                continue
            existing = {c["name"] for c in insp.get_columns(table)}
            for col, kind in columns:
                if col not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {kind}"))


add_missing_columns()

app = FastAPI(title="Salarite Virtual HR API")

# Deploy ke time CORS_ORIGINS me apna frontend URL daalo (comma separated)
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(tasks.router)
app.include_router(interviews.router)
app.include_router(users.router)

DEMO_USERS = [
    ("employer", "employer123", "employer"),
    ("hr", "hr123456", "hr"),
    ("hr2", "hr234567", "hr"),
    ("employer2", "employer456", "employer"),
]


@app.on_event("startup")
def seed_demo_users():
    """Demo users banata hai (ya unka password demo wala reset karta hai)."""
    db = SessionLocal()
    try:
        for username, password, role in DEMO_USERS:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user.password_hash = hash_password(password)
                user.role = role
            else:
                db.add(User(username=username, password_hash=hash_password(password), role=role))
        db.commit()
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Salarite Virtual HR API is running"}
