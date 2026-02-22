from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_current_user
from app.api.v1.schemas import SignupRequest, LoginRequest, UserOut, APIResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=get_password_hash(body.password),
        name=body.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    _set_cookie(response, token)

    return APIResponse(data=UserOut.model_validate(user))


@router.post("/login", response_model=APIResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    _set_cookie(response, token)

    return APIResponse(data=UserOut.model_validate(user))


@router.post("/logout", response_model=APIResponse)
def logout(response: Response):
    response.delete_cookie("access_token")
    return APIResponse(message="Logged out successfully")


@router.get("/me", response_model=APIResponse)
def me(current_user: User = Depends(get_current_user)):
    return APIResponse(data=UserOut.model_validate(current_user))


def _set_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
