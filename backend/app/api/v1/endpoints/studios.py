from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.db.models import Studio, ClassSession, Booking, BookingStatus, WaitlistEntry, WaitlistStatus, User
from app.core.deps import get_current_user
from app.api.v1.schemas import StudioOut, SessionOut, APIResponse
from app.services.booking import book_session, cancel_booking, join_waitlist, _expire_stale_offers

router = APIRouter(tags=["studios"])


@router.get("/studios/{slug}", response_model=APIResponse)
def get_studio(slug: str, db: Session = Depends(get_db)):
    studio = db.query(Studio).filter(Studio.slug == slug).first()
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    return APIResponse(data=StudioOut.model_validate(studio))


@router.get("/studios/{slug}/schedule", response_model=APIResponse)
def get_schedule(
    slug: str,
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    q: Optional[str] = None,
    instructor: Optional[str] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(lambda: None),
):
    studio = db.query(Studio).filter(Studio.slug == slug).first()
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    query = db.query(ClassSession).options(
        joinedload(ClassSession.bookings),
        joinedload(ClassSession.waitlist_entries),
    ).filter(ClassSession.studio_id == studio.id)

    if from_date:
        try:
            dt = datetime.fromisoformat(from_date)
            query = query.filter(ClassSession.start_at >= dt)
        except ValueError:
            pass

    if to_date:
        try:
            dt = datetime.fromisoformat(to_date)
            query = query.filter(ClassSession.start_at <= dt)
        except ValueError:
            pass

    if q:
        search = f"%{q}%"
        query = query.filter(
            (ClassSession.title.ilike(search)) |
            (ClassSession.instructor.ilike(search))
        )

    if instructor:
        query = query.filter(ClassSession.instructor.ilike(f"%{instructor}%"))

    if type:
        query = query.filter(ClassSession.type.ilike(f"%{type}%"))

    total = query.count()
    sessions = query.order_by(ClassSession.start_at).offset((page - 1) * page_size).limit(page_size).all()

    return APIResponse(data={
        "sessions": [_session_to_out(s, None) for s in sessions],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    })


@router.get("/studios/{slug}/schedule/auth", response_model=APIResponse)
def get_schedule_authed(
    slug: str,
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    q: Optional[str] = None,
    instructor: Optional[str] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    studio = db.query(Studio).filter(Studio.slug == slug).first()
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    query = db.query(ClassSession).options(
        joinedload(ClassSession.bookings),
        joinedload(ClassSession.waitlist_entries),
    ).filter(ClassSession.studio_id == studio.id)

    if from_date:
        try:
            dt = datetime.fromisoformat(from_date)
            query = query.filter(ClassSession.start_at >= dt)
        except ValueError:
            pass

    if to_date:
        try:
            dt = datetime.fromisoformat(to_date)
            query = query.filter(ClassSession.start_at <= dt)
        except ValueError:
            pass

    if q:
        search = f"%{q}%"
        query = query.filter(
            (ClassSession.title.ilike(search)) |
            (ClassSession.instructor.ilike(search))
        )

    if instructor:
        query = query.filter(ClassSession.instructor.ilike(f"%{instructor}%"))

    if type:
        query = query.filter(ClassSession.type.ilike(f"%{type}%"))

    total = query.count()
    sessions = query.order_by(ClassSession.start_at).offset((page - 1) * page_size).limit(page_size).all()

    return APIResponse(data={
        "sessions": [_session_to_out(s, current_user) for s in sessions],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    })


@router.post("/studios/{slug}/sessions/{session_id}/book", response_model=APIResponse)
def book(
    slug: str,
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    studio = db.query(Studio).filter(Studio.slug == slug).first()
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    session = db.query(ClassSession).filter(
        ClassSession.id == session_id,
        ClassSession.studio_id == studio.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.start_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot book a past session")

    result = book_session(db, session, current_user)
    return APIResponse(
        message="Booked successfully" if result["type"] == "booking" else "Added to waitlist",
        data=result,
    )


@router.post("/studios/{slug}/sessions/{session_id}/cancel", response_model=APIResponse)
def cancel(
    slug: str,
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    studio = db.query(Studio).filter(Studio.slug == slug).first()
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    session = db.query(ClassSession).filter(
        ClassSession.id == session_id,
        ClassSession.studio_id == studio.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    result = cancel_booking(db, session, current_user)
    return APIResponse(message="Booking cancelled", data=result)


@router.post("/studios/{slug}/sessions/{session_id}/waitlist", response_model=APIResponse)
def add_to_waitlist(
    slug: str,
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    studio = db.query(Studio).filter(Studio.slug == slug).first()
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    session = db.query(ClassSession).filter(
        ClassSession.id == session_id,
        ClassSession.studio_id == studio.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    entry = join_waitlist(db, session, current_user)
    return APIResponse(message="Added to waitlist", data={"position": entry.position})


def _session_to_out(session: ClassSession, user: Optional[User]) -> dict:
    booked_count = sum(1 for b in session.bookings if b.status == BookingStatus.booked)
    spots_left = max(0, session.capacity - booked_count)

    user_booking_status = None
    waitlist_position = None

    if user:
        user_booking = next(
            (b for b in session.bookings if b.user_id == user.id and b.status == BookingStatus.booked),
            None
        )
        if user_booking:
            user_booking_status = "booked"
        else:
            user_wl = next(
                (w for w in session.waitlist_entries if w.user_id == user.id and w.status in ("waiting", "offered")),
                None
            )
            if user_wl:
                user_booking_status = "waitlist"
                waitlist_position = user_wl.position

    return {
        "id": session.id,
        "studio_id": session.studio_id,
        "title": session.title,
        "type": session.type,
        "instructor": session.instructor,
        "capacity": session.capacity,
        "spots_left": spots_left,
        "is_full": spots_left == 0,
        "start_at": session.start_at,
        "end_at": session.end_at,
        "user_booking_status": user_booking_status,
        "waitlist_position": waitlist_position,
    }
