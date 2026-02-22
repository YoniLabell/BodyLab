from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.endpoints import auth, studios, me, admin

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
def health():
    return {"status": "ok", "version": settings.VERSION}


# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(studios.router, prefix="/api/v1")
app.include_router(me.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"},
    )


@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME} API", "docs": "/docs"}
