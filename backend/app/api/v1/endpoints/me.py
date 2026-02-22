from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.db.models import Booking, BookingStatus, ClassSession, User
from app.core.deps import get_current_user
from app.api.v1.schemas import APIResponse

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/bookings", response_model=APIResponse)
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.session))
        .filter(
            Booking.user_id == current_user.id,
            Booking.status == BookingStatus.booked,
        )
        .join(ClassSession)
        .filter(ClassSession.start_at >= now)
        .order_by(ClassSession.start_at)
        .all()
    )

    result = []
    for b in bookings:
        from app.api.v1.endpoints.studios import _session_to_out
        session_data = _session_to_out(b.session, current_user)
        result.append({
            "id": b.id,
            "status": b.status.value,
            "created_at": b.created_at,
            "session": session_data,
        })

    return APIResponse(data=result)
