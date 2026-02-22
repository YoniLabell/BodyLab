from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.db.models import (
    Booking, BookingStatus, ClassSession, WaitlistEntry, WaitlistStatus, User
)


WAITLIST_OFFER_MINUTES = 15


def get_session_or_404(db: Session, session_id: UUID, studio_id: Optional[UUID] = None) -> ClassSession:
    q = db.query(ClassSession).filter(ClassSession.id == session_id)
    if studio_id:
        q = q.filter(ClassSession.studio_id == studio_id)
    session = q.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def get_active_booking(db: Session, session_id: UUID, user_id: UUID) -> Optional[Booking]:
    return db.query(Booking).filter(
        Booking.session_id == session_id,
        Booking.user_id == user_id,
        Booking.status == BookingStatus.booked,
    ).first()


def get_waitlist_entry(db: Session, session_id: UUID, user_id: UUID) -> Optional[WaitlistEntry]:
    return db.query(WaitlistEntry).filter(
        WaitlistEntry.session_id == session_id,
        WaitlistEntry.user_id == user_id,
    ).first()


def book_session(db: Session, session: ClassSession, user: User) -> dict:
    # Check existing booking
    existing = get_active_booking(db, session.id, user.id)
    if existing:
        raise HTTPException(status_code=409, detail="Already booked for this session")

    # Check existing waitlist
    waitlist = get_waitlist_entry(db, session.id, user.id)
    if waitlist and waitlist.status in (WaitlistStatus.waiting, WaitlistStatus.offered):
        raise HTTPException(status_code=409, detail="Already on waitlist for this session")

    # Expire any stale offers before checking availability
    _expire_stale_offers(db, session.id)
    db.flush()

    # Reload session to get fresh counts
    db.refresh(session)
    booked_count = db.query(Booking).filter(
        Booking.session_id == session.id,
        Booking.status == BookingStatus.booked,
    ).count()

    spots_left = max(0, session.capacity - booked_count)

    if spots_left > 0:
        booking = Booking(
            studio_id=session.studio_id,
            session_id=session.id,
            user_id=user.id,
            status=BookingStatus.booked,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return {"type": "booking", "booking": booking}
    else:
        # Add to waitlist
        max_pos = db.query(WaitlistEntry).filter(
            WaitlistEntry.session_id == session.id,
            WaitlistEntry.status.in_([WaitlistStatus.waiting, WaitlistStatus.offered]),
        ).count()

        entry = WaitlistEntry(
            studio_id=session.studio_id,
            session_id=session.id,
            user_id=user.id,
            position=max_pos + 1,
            status=WaitlistStatus.waiting,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return {"type": "waitlist", "entry": entry}


def cancel_booking(db: Session, session: ClassSession, user: User) -> dict:
    booking = get_active_booking(db, session.id, user.id)
    if not booking:
        raise HTTPException(status_code=404, detail="No active booking found")

    booking.status = BookingStatus.cancelled
    db.flush()

    # Offer spot to first waiting person
    _offer_next_waitlist(db, session.id, session.studio_id)
    db.commit()

    return {"cancelled": True}


def join_waitlist(db: Session, session: ClassSession, user: User) -> WaitlistEntry:
    existing = get_active_booking(db, session.id, user.id)
    if existing:
        raise HTTPException(status_code=409, detail="You already have a booking for this session")

    existing_wl = get_waitlist_entry(db, session.id, user.id)
    if existing_wl and existing_wl.status in (WaitlistStatus.waiting, WaitlistStatus.offered):
        raise HTTPException(status_code=409, detail="Already on waitlist")

    max_pos = db.query(WaitlistEntry).filter(
        WaitlistEntry.session_id == session.id,
        WaitlistEntry.status.in_([WaitlistStatus.waiting, WaitlistStatus.offered]),
    ).count()

    entry = WaitlistEntry(
        studio_id=session.studio_id,
        session_id=session.id,
        user_id=user.id,
        position=max_pos + 1,
        status=WaitlistStatus.waiting,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def _expire_stale_offers(db: Session, session_id: UUID):
    now = datetime.now(timezone.utc)
    stale = db.query(WaitlistEntry).filter(
        WaitlistEntry.session_id == session_id,
        WaitlistEntry.status == WaitlistStatus.offered,
        WaitlistEntry.offered_until < now,
    ).all()
    for entry in stale:
        entry.status = WaitlistStatus.expired


def _offer_next_waitlist(db: Session, session_id: UUID, studio_id: UUID):
    # First expire stale offers
    _expire_stale_offers(db, session_id)

    # Check if there's already an active offer
    active_offer = db.query(WaitlistEntry).filter(
        WaitlistEntry.session_id == session_id,
        WaitlistEntry.status == WaitlistStatus.offered,
    ).first()

    if active_offer:
        return  # Someone already has an offer

    # Find next waiting entry
    next_entry = db.query(WaitlistEntry).filter(
        WaitlistEntry.session_id == session_id,
        WaitlistEntry.status == WaitlistStatus.waiting,
    ).order_by(WaitlistEntry.position).first()

    if next_entry:
        next_entry.status = WaitlistStatus.offered
        next_entry.offered_until = datetime.now(timezone.utc) + timedelta(minutes=WAITLIST_OFFER_MINUTES)
