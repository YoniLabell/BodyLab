from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "BodyLab"
    DEBUG: bool = False
    VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bodylab"

    # JWT
    SECRET_KEY: str = "changeme-in-production-super-secret-key-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Cookie
    COOKIE_SECURE: bool = False  # True in production (HTTPS)
    COOKIE_SAMESITE: str = "lax"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
