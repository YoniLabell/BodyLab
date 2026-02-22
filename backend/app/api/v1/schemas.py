from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator


# ── Generic ─────────────────────────────────────────────────────────────────

class APIResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None


# ── Auth ─────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Studio ────────────────────────────────────────────────────────────────────

class StudioOut(BaseModel):
    id: UUID
    name: str
    slug: str
    timezone: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class StudioCreate(BaseModel):
    name: str
    slug: str
    timezone: str = "UTC"
    description: Optional[str] = None


# ── Class Template ────────────────────────────────────────────────────────────

class ClassTemplateCreate(BaseModel):
    title: str
    type: str
    instructor: str
    capacity: int = 20
    weekday: int  # 0=Monday, 6=Sunday
    start_time: str  # "HH:MM"
    duration_minutes: int = 60


class ClassTemplateOut(BaseModel):
    id: UUID
    studio_id: UUID
    title: str
    type: str
    instructor: str
    capacity: int
    weekday: int
    start_time: str
    duration_minutes: int
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Session ───────────────────────────────────────────────────────────────────

class SessionOut(BaseModel):
    id: UUID
    studio_id: UUID
    title: str
    type: str
    instructor: str
    capacity: int
    spots_left: int
    is_full: bool
    start_at: datetime
    end_at: datetime
    user_booking_status: Optional[str] = None  # "booked", "waitlist", None
    waitlist_position: Optional[int] = None

    model_config = {"from_attributes": True}


# ── Booking ───────────────────────────────────────────────────────────────────

class BookingOut(BaseModel):
    id: UUID
    session_id: UUID
    user_id: UUID
    status: str
    created_at: datetime
    session: Optional["SessionOut"] = None

    model_config = {"from_attributes": True}


class UpcomingBookingOut(BaseModel):
    id: UUID
    status: str
    created_at: datetime
    session: SessionOut

    model_config = {"from_attributes": True}


# ── Waitlist ──────────────────────────────────────────────────────────────────

class WaitlistOut(BaseModel):
    id: UUID
    session_id: UUID
    position: int
    status: str
    offered_until: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
