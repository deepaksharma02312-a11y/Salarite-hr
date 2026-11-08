from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user, require_role
from database import get_db
from models import Task, User, now
from schemas import TaskCreate, TaskEdit, TaskOut, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
def list_tasks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Employer ko sirf apne diye hue tasks, HR ko sirf apne ko mile hue tasks dikhte hain."""
    query = db.query(Task)
    if user.role == "employer":
        query = query.filter(Task.created_by_id == user.id)
    else:
        query = query.filter(Task.assigned_to_id == user.id)
    return query.order_by(Task.id.desc()).all()


@router.post("", response_model=TaskOut, status_code=201)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("employer")),
):
    hr = db.get(User, data.assigned_to_id)
    if not hr or hr.role != "hr":
        raise HTTPException(status_code=400, detail="Please choose a valid HR")
    task = Task(**data.model_dump(), created_by_id=user.id, assigned_at=now())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskOut)
def edit_task(
    task_id: int,
    data: TaskEdit,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("employer")),
):
    """Employer apna task badal sakta hai (jab tak completed na ho) ya dusre HR ko de sakta hai."""
    task = db.get(Task, task_id)
    if not task or task.created_by_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == "completed":
        raise HTTPException(status_code=400, detail="Completed tasks cannot be edited")
    hr = db.get(User, data.assigned_to_id)
    if not hr or hr.role != "hr":
        raise HTTPException(status_code=400, detail="Please choose a valid HR")

    task.title = data.title
    task.description = data.description
    task.priority = data.priority
    if hr.id != task.assigned_to_id:
        # Naye HR ne abhi kaam shuru nahi kiya, isliye status aur note reset
        task.assigned_to_id = hr.id
        task.status = "pending"
        task.hr_note = ""
        task.assigned_at = now()
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("hr")),
):
    task = db.get(Task, task_id)
    # Sirf wahi HR update kar sakta hai jisko task mila hai
    if not task or task.assigned_to_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = data.status
    if data.hr_note is not None:
        task.hr_note = data.hr_note
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("employer")),
):
    task = db.get(Task, task_id)
    if not task or task.created_by_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    # Is task se jude interviews ka link hata do (interview delete nahi karte)
    for interview in task.interviews:
        interview.task_id = None
    db.delete(task)
    db.commit()
