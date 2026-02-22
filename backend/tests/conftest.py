import pytest
from datetime import datetime, timedelta, timezone
from typing import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import get_db, Base
from app.db.models import Studio, User, ClassTemplate, ClassSession
from app.core.security import get_password_hash

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator:
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db) -> Generator:
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def studio(db) -> Studio:
    s = Studio(
        name="Test Studio",
        slug="test-studio",
        timezone="UTC",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@pytest.fixture
def user(db) -> User:
    u = User(
        email="user@test.com",
        password_hash=get_password_hash("password123"),
        name="Test User",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def user2(db) -> User:
    u = User(
        email="user2@test.com",
        password_hash=get_password_hash("password123"),
        name="Test User 2",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def admin_user(db) -> User:
    u = User(
        email="admin@test.com",
        password_hash=get_password_hash("admin1234"),
        name="Admin",
        is_admin=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def future_session(db, studio) -> ClassSession:
    now = datetime.now(timezone.utc)
    s = ClassSession(
        studio_id=studio.id,
        title="Morning Yoga",
        type="Yoga",
        instructor="Sarah",
        capacity=5,
        start_at=now + timedelta(days=1),
        end_at=now + timedelta(days=1, hours=1),
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@pytest.fixture
def full_session(db, studio) -> ClassSession:
    """Session with capacity=1 that will be full after one booking."""
    now = datetime.now(timezone.utc)
    s = ClassSession(
        studio_id=studio.id,
        title="Full Class",
        type="HIIT",
        instructor="Marcus",
        capacity=1,
        start_at=now + timedelta(days=2),
        end_at=now + timedelta(days=2, hours=1),
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
