import os
from datetime import timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import hash_password
from sqlalchemy import inspect, text

from database import Base, SessionLocal, engine
from models import Interview, Task, User, now
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


def seed_demo_data(db):
    """Database khali ho to kuch sample tasks aur interviews bana deta hai.
    Free hosting pe database reset ho jaye tab bhi reviewer ko dashboard khali nahi dikhega."""
    if db.query(Task).count() > 0:
        return
    employer = db.query(User).filter(User.username == "employer").first()
    hr = db.query(User).filter(User.username == "hr").first()
    hr2 = db.query(User).filter(User.username == "hr2").first()
    if not (employer and hr):
        return

    def task(title, desc, priority, status, owner, note=""):
        return Task(
            title=title, description=desc, priority=priority, status=status, hr_note=note,
            created_by_id=employer.id, assigned_to_id=owner.id, assigned_at=now(),
        )

    db.add_all([
        task("Screen 10 backend resumes", "Shortlist resumes with Python and FastAPI experience.", "high", "pending", hr),
        task("Call 5 shortlisted candidates", "Confirm availability and expected salary.", "high", "in_progress", hr,
             "3 reached, 2 awaiting callback"),
        task("Post React developer job", "Publish the opening on LinkedIn and Naukri.", "medium", "pending", hr),
        task("Collect new joiner documents", "ID proof, degree certificate and previous offer letter.", "low", "completed", hr,
             "All 3 documents received and verified"),
    ])
    if hr2:
        db.add(task("Schedule first-round interviews", "Offer interview slots to the shortlisted candidates.", "medium", "pending", hr2))

    start = now() + timedelta(days=1)
    db.add_all([
        Interview(candidate_name="Rahul Sharma", candidate_email="rahul@example.com", mode="video",
                  scheduled_at=start, ends_at=start + timedelta(minutes=30),
                  created_by_id=hr.id, employer_id=employer.id),
        Interview(candidate_name="Priya Singh", candidate_email="priya@example.com", mode="voice",
                  scheduled_at=start + timedelta(days=1, hours=2), ends_at=start + timedelta(days=1, hours=2, minutes=45),
                  created_by_id=hr.id, employer_id=employer.id),
    ])
    db.commit()


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
        seed_demo_data(db)
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Salarite Virtual HR API is running"}