"""Tests for booking and waitlist service logic."""
import pytest
from datetime import datetime, timedelta, timezone

from app.db.models import Booking, BookingStatus, WaitlistEntry, WaitlistStatus
from app.services.booking import book_session, cancel_booking, join_waitlist


class TestBookSession:
    def test_book_available_session(self, db, user, future_session):
        result = book_session(db, future_session, user)
        assert result["type"] == "booking"
        booking = result["booking"]
        assert booking.status == BookingStatus.booked
        assert booking.user_id == user.id
        assert booking.session_id == future_session.id

    def test_book_full_session_goes_to_waitlist(self, db, user, user2, full_session):
        # User1 books the only spot
        result1 = book_session(db, full_session, user)
        assert result1["type"] == "booking"

        # User2 goes to waitlist
        result2 = book_session(db, full_session, user2)
        assert result2["type"] == "waitlist"
        entry = result2["entry"]
        assert entry.status == WaitlistStatus.waiting
        assert entry.position == 1

    def test_double_booking_raises(self, db, user, future_session):
        from fastapi import HTTPException
        book_session(db, future_session, user)
        with pytest.raises(HTTPException) as exc_info:
            book_session(db, future_session, user)
        assert exc_info.value.status_code == 409

    def test_book_counts_capacity_correctly(self, db, studio):
        """Session with capacity 3 allows 3 bookings then waitlists."""
        from app.db.models import User, ClassSession
        from app.core.security import get_password_hash
        now = datetime.now(timezone.utc)
        session = ClassSession(
            studio_id=studio.id,
            title="Small Class",
            type="Yoga",
            instructor="Test",
            capacity=3,
            start_at=now + timedelta(days=1),
            end_at=now + timedelta(days=1, hours=1),
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        users = []
        for i in range(4):
            u = User(
                email=f"cap_test_{i}@test.com",
                password_hash=get_password_hash("pass"),
                name=f"User {i}",
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            users.append(u)

        results = [book_session(db, session, u) for u in users]
        assert results[0]["type"] == "booking"
        assert results[1]["type"] == "booking"
        assert results[2]["type"] == "booking"
        assert results[3]["type"] == "waitlist"


class TestCancelBooking:
    def test_cancel_offers_waitlist_spot(self, db, user, user2, full_session):
        # Fill the session
        result1 = book_session(db, full_session, user)
        assert result1["type"] == "booking"

        # User2 joins waitlist
        result2 = book_session(db, full_session, user2)
        assert result2["type"] == "waitlist"

        # User1 cancels
        cancel_booking(db, full_session, user)

        # User2 should now have an offer
        db.refresh(result2["entry"])
        entry = db.query(WaitlistEntry).filter(
            WaitlistEntry.session_id == full_session.id,
            WaitlistEntry.user_id == user2.id,
        ).first()
        assert entry.status == WaitlistStatus.offered
        assert entry.offered_until is not None

    def test_cancel_nonexistent_booking_raises(self, db, user, future_session):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            cancel_booking(db, future_session, user)
        assert exc_info.value.status_code == 404

    def test_cancel_already_cancelled_raises(self, db, user, future_session):
        from fastapi import HTTPException
        book_session(db, future_session, user)
        cancel_booking(db, future_session, user)
        with pytest.raises(HTTPException):
            cancel_booking(db, future_session, user)


class TestWaitlist:
    def test_join_waitlist_full_session(self, db, user, user2, full_session):
        book_session(db, full_session, user)
        entry = join_waitlist(db, full_session, user2)
        assert entry.status == WaitlistStatus.waiting
        assert entry.position == 1

    def test_waitlist_position_increments(self, db, studio):
        from app.db.models import User, ClassSession
        from app.core.security import get_password_hash
        now = datetime.now(timezone.utc)
        session = ClassSession(
            studio_id=studio.id,
            title="Waitlist Test",
            type="Yoga",
            instructor="Test",
            capacity=0,
            start_at=now + timedelta(days=1),
            end_at=now + timedelta(days=1, hours=1),
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        users = []
        for i in range(3):
            u = User(
                email=f"wl_test_{i}@test.com",
                password_hash=get_password_hash("pass"),
                name=f"WL User {i}",
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            users.append(u)

        entries = [join_waitlist(db, session, u) for u in users]
        assert entries[0].position == 1
        assert entries[1].position == 2
        assert entries[2].position == 3

    def test_already_on_waitlist_raises(self, db, user, full_session):
        from fastapi import HTTPException
        book_session(db, full_session, user)  # fill session
        users_db = db

        # Make a second user to fill and put on waitlist
        from app.db.models import User
        from app.core.security import get_password_hash
        u2 = User(email="wl2@t.com", password_hash=get_password_hash("pass"), name="WL2")
        db.add(u2)
        db.commit()
        db.refresh(u2)

        join_waitlist(db, full_session, u2)
        with pytest.raises(HTTPException) as exc_info:
            join_waitlist(db, full_session, u2)
        assert exc_info.value.status_code == 409

    def test_offered_spot_expires_and_offers_next(self, db, user, user2, full_session):
        from datetime import timezone
        # Fill the session
        book_session(db, full_session, user)

        # Both user and user2 on waitlist (we need a third user)
        from app.db.models import User
        from app.core.security import get_password_hash
        u3 = User(email="u3@t.com", password_hash=get_password_hash("pass"), name="U3")
        db.add(u3)
        db.commit()
        db.refresh(u3)

        e2 = join_waitlist(db, full_session, user2)
        e3 = join_waitlist(db, full_session, u3)

        # Cancel original booking => user2 gets offered
        cancel_booking(db, full_session, user)
        db.refresh(e2)
        assert e2.status == WaitlistStatus.offered

        # Manually expire user2's offer
        from datetime import timedelta
        e2.offered_until = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()

        # Now book the session again as user to trigger re-booking and waitlist expiry check
        # Simulate next cancel by running the booking service
        from app.services.booking import _expire_stale_offers, _offer_next_waitlist

        _expire_stale_offers(db, full_session.id)
        db.commit()
        db.refresh(e2)
        assert e2.status == WaitlistStatus.expired

        _offer_next_waitlist(db, full_session.id, full_session.studio_id)
        db.commit()
        db.refresh(e3)
        assert e3.status == WaitlistStatus.offered
