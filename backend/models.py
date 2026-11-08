from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    role: Mapped[str] = mapped_column(String(20))  # "employer" ya "hr"
    token: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[str] = mapped_column(String(10), default="medium")  # low/medium/high
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/in_progress/completed
    hr_note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    # Kisne task diya (employer) aur kis HR ko diya
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    assigned_to_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime, default=now, nullable=True)  # HR ko kab mila

    creator: Mapped[User | None] = relationship(foreign_keys=[created_by_id])
    assignee: Mapped[User | None] = relationship(foreign_keys=[assigned_to_id])
    interviews: Mapped[list["Interview"]] = relationship(back_populates="task")

    @property
    def created_by_name(self) -> str | None:
        return self.creator.username if self.creator else None

    @property
    def assigned_to_name(self) -> str | None:
        return self.assignee.username if self.assignee else None


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_name: Mapped[str] = mapped_column(String(100))
    candidate_email: Mapped[str] = mapped_column(String(120), default="")
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)  # start time
    ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # end time
    mode: Mapped[str] = mapped_column(String(10))  # voice/video/chat
    status: Mapped[str] = mapped_column(String(20), default="scheduled")  # scheduled/in_progress/completed/cancelled
    room_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)  # kis HR ne schedule kiya
    employer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)  # kis employer ke liye

    task: Mapped[Task | None] = relationship(back_populates="interviews")
    creator: Mapped[User | None] = relationship(foreign_keys=[created_by_id])
    employer: Mapped[User | None] = relationship(foreign_keys=[employer_id])

    @property
    def created_by_name(self) -> str | None:
        return self.creator.username if self.creator else None

    @property
    def employer_name(self) -> str | None:
        return self.employer.username if self.employer else None
