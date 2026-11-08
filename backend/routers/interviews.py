import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user, require_role
from database import get_db
from models import Interview, Task, User
from schemas import CallStartOut, InterviewCreate, InterviewOut, InterviewStatusUpdate

router = APIRouter(prefix="/interviews", tags=["interviews"])


def own_interview(db: Session, interview_id: int, hr: User) -> Interview:
    interview = db.get(Interview, interview_id)
    if not interview or interview.created_by_id != hr.id:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.get("", response_model=list[InterviewOut])
def list_interviews(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """HR ko apne schedule kiye interviews. Employer ko wo interviews jo uske liye schedule hue."""
    query = db.query(Interview)
    if user.role == "hr":
        query = query.filter(Interview.created_by_id == user.id)
    else:
        query = query.filter(Interview.employer_id == user.id)
    return query.order_by(Interview.scheduled_at).all()


@router.post("", response_model=InterviewOut, status_code=201)
def schedule_interview(
    data: InterviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("hr")),
):
    employer = db.get(User, data.employer_id)
    if not employer or employer.role != "employer":
        raise HTTPException(status_code=400, detail="Please choose a valid employer")
    if data.task_id is not None:
        task = db.get(Task, data.task_id)
        if not task or task.assigned_to_id != user.id:
            raise HTTPException(status_code=404, detail="Linked task not found")
    interview = Interview(**data.model_dump(), created_by_id=user.id)
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


@router.patch("/{interview_id}", response_model=InterviewOut)
def update_interview_status(
    interview_id: int,
    data: InterviewStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("hr")),
):
    interview = own_interview(db, interview_id, user)
    interview.status = data.status
    db.commit()
    db.refresh(interview)
    return interview


@router.post("/{interview_id}/start", response_model=CallStartOut)
def start_call(
    interview_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("hr")),
):
    """In-built calling PLACEHOLDER.
    Asli voice/video/chat yahan baad me jodna hai (WebRTC, Twilio, Daily.co etc.)."""
    interview = own_interview(db, interview_id, user)
    if interview.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Interview is already {interview.status}")
    if not interview.room_id:
        interview.room_id = f"room-{secrets.token_hex(4)}"
    interview.status = "in_progress"
    db.commit()
    return {
        "room_id": interview.room_id,
        "mode": interview.mode,
        "message": f"Placeholder: {interview.mode} session started. Real calling will plug in here.",
    }
