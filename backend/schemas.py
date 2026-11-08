import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

TaskStatus = Literal["pending", "in_progress", "completed"]
Priority = Literal["low", "medium", "high"]
InterviewMode = Literal["voice", "video", "chat"]
InterviewStatus = Literal["scheduled", "in_progress", "completed", "cancelled"]


class LoginIn(BaseModel):
    username: str
    password: str


class RegisterIn(BaseModel):
    username: str
    password: str
    role: Literal["employer", "hr"]

    @field_validator("username")
    @classmethod
    def check_username(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.fullmatch(r"[a-z0-9_]{3,30}", v):
            raise ValueError("Username must be 3 to 30 characters: letters, numbers or underscore")
        return v

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password is too long")
        return v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    role: str


class LoginOut(BaseModel):
    token: str
    user: UserOut


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    priority: Priority = "medium"
    assigned_to_id: int  # kis HR ko task dena hai


class TaskEdit(BaseModel):
    """Employer task badalta hai (title, details, priority, ya dusre HR ko deta hai)."""
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    priority: Priority = "medium"
    assigned_to_id: int


class TaskUpdate(BaseModel):
    status: TaskStatus
    hr_note: str | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    priority: str
    status: str
    hr_note: str
    created_at: datetime
    updated_at: datetime
    created_by_id: int | None
    created_by_name: str | None
    assigned_to_id: int | None
    assigned_to_name: str | None
    assigned_at: datetime | None


class InterviewCreate(BaseModel):
    candidate_name: str = Field(min_length=1, max_length=100)
    candidate_email: str = ""
    scheduled_at: datetime  # start time
    ends_at: datetime  # end time
    mode: InterviewMode
    employer_id: int  # interview kis employer ke liye hai
    task_id: int | None = None

    @model_validator(mode="after")
    def check_times(self):
        if self.ends_at <= self.scheduled_at:
            raise ValueError("End time must be after start time")
        return self


class InterviewStatusUpdate(BaseModel):
    status: InterviewStatus


class InterviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    candidate_name: str
    candidate_email: str
    scheduled_at: datetime
    ends_at: datetime | None
    mode: str
    status: str
    room_id: str | None
    task_id: int | None
    created_at: datetime
    created_by_name: str | None
    employer_id: int | None
    employer_name: str | None


class CallStartOut(BaseModel):
    room_id: str
    mode: str
    message: str
