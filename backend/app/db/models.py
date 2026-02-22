import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    String, Integer, Boolean, DateTime, ForeignKey, Text,
    UniqueConstraint, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
import enum


def utcnow():
    return datetime.now(timezone.utc)


class BookingStatus(str, enum.Enum):
    booked = "booked"
    cancelled = "cancelled"


class WaitlistStatus(str, enum.Enum):
    waiting = "waiting"
    offered = "offered"
    expired = "expired"
    accepted = "accepted"


class Studio(Base):
    __tablename__ = "studios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    timezone: Mapped[str] = mapped_column(String(100), default="UTC")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    class_templates: Mapped[list["ClassTemplate"]] = relationship(back_populates="studio", cascade="all, delete-orphan")
    class_sessions: Mapped[list["ClassSession"]] = relationship(back_populates="studio", cascade="all, delete-orphan")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="studio", cascade="all, delete-orphan")
    waitlist_entries: Mapped[list["WaitlistEntry"]] = relationship(back_populates="studio", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    waitlist_entries: Mapped[list["WaitlistEntry"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class ClassTemplate(Base):
    __tablename__ = "class_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    studio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studios.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    instructor: Mapped[str] = mapped_column(String(255), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon, 6=Sun
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)  # "HH:MM"
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    studio: Mapped["Studio"] = relationship(back_populates="class_templates")
    class_sessions: Mapped[list["ClassSession"]] = relationship(back_populates="template", cascade="all, delete-orphan")


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    studio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studios.id", ondelete="CASCADE"), nullable=False)
    template_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("class_templates.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    instructor: Mapped[str] = mapped_column(String(255), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    studio: Mapped["Studio"] = relationship(back_populates="class_sessions")
    template: Mapped[Optional["ClassTemplate"]] = relationship(back_populates="class_sessions")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    waitlist_entries: Mapped[list["WaitlistEntry"]] = relationship(back_populates="session", cascade="all, delete-orphan")

    @property
    def booked_count(self) -> int:
        return sum(1 for b in self.bookings if b.status == BookingStatus.booked)

    @property
    def spots_left(self) -> int:
        return max(0, self.capacity - self.booked_count)

    @property
    def is_full(self) -> bool:
        return self.spots_left == 0


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    studio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studios.id", ondelete="CASCADE"), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(SQLEnum(BookingStatus), nullable=False, default=BookingStatus.booked)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        UniqueConstraint("session_id", "user_id", name="uq_booking_session_user"),
    )

    studio: Mapped["Studio"] = relationship(back_populates="bookings")
    session: Mapped["ClassSession"] = relationship(back_populates="bookings")
    user: Mapped["User"] = relationship(back_populates="bookings")


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    studio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studios.id", ondelete="CASCADE"), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[WaitlistStatus] = mapped_column(SQLEnum(WaitlistStatus), nullable=False, default=WaitlistStatus.waiting)
    offered_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        UniqueConstraint("session_id", "user_id", name="uq_waitlist_session_user"),
    )

    studio: Mapped["Studio"] = relationship(back_populates="waitlist_entries")
    session: Mapped["ClassSession"] = relationship(back_populates="waitlist_entries")
    user: Mapped["User"] = relationship(back_populates="waitlist_entries")
