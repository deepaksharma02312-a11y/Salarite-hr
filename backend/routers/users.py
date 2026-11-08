from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import User
from schemas import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/hrs", response_model=list[UserOut])
def list_hrs(db: Session = Depends(get_db), _: User = Depends(require_role("employer"))):
    """Employer ke 'Assign to' list ke liye saare HR accounts."""
    return db.query(User).filter(User.role == "hr").order_by(User.username).all()


@router.get("/employers", response_model=list[UserOut])
def list_employers(db: Session = Depends(get_db), _: User = Depends(require_role("hr"))):
    """HR ke interview form ke liye saare employer accounts."""
    return db.query(User).filter(User.role == "employer").order_by(User.username).all()
