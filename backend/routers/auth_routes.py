from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_user, hash_password, new_token, verify_password
from database import get_db
from models import User
from schemas import LoginIn, LoginOut, RegisterIn, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    username = data.username.strip().lower()
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Wrong username or password")
    user.token = new_token()
    db.commit()
    return {"token": user.token, "user": user}


@router.post("/register", response_model=LoginOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    """Naya employer ya HR account banata hai aur seedha login bhi kar deta hai."""
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=409, detail="Username already taken")
    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        role=data.role,
        token=new_token(),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # do log ek saath same username le rahe ho to
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already taken")
    db.refresh(user)
    return {"token": user.token, "user": user}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
