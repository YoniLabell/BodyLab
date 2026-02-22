from datetime import datetime, timedelta, timezone, time
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Studio, ClassTemplate, ClassSession, User
from app.core.deps import get_current_admin
from app.api.v1.schemas import StudioCreate, ClassTemplateCreate, StudioOut, ClassTemplateOut, APIResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/studios", response_model=APIResponse)
def list_studios(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    studios = db.query(Studio).order_by(Studio.created_at.desc()).all()
    return APIResponse(data=[StudioOut.model_validate(s) for s in studios])


@router.post("/studios", response_model=APIResponse, status_code=201)
def create_studio(
    body: StudioCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    existing = db.query(Studio).filter(Studio.slug == body.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Slug already exists")

    studio = Studio(**body.model_dump())
    db.add(studio)
    db.commit()
    db.refresh(studio)
    return APIResponse(data=StudioOut.model_validate(studio))


@router.get("/studios/{studio_id}/class-templates", response_model=APIResponse)
def list_templates(
    studio_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    templates = db.query(ClassTemplate).filter(ClassTemplate.studio_id == studio_id).all()
    return APIResponse(data=[ClassTemplateOut.model_validate(t) for t in templates])


@router.post("/studios/{studio_id}/class-templates", response_model=APIResponse, status_code=201)
def create_class_template(
    studio_id: UUID,
    body: ClassTemplateCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    studio = db.query(Studio).filter(Studio.id == studio_id).first()
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    template = ClassTemplate(studio_id=studio_id, **body.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return APIResponse(data=ClassTemplateOut.model_validate(template))


@router.post("/studios/{studio_id}/generate-sessions", response_model=APIResponse)
def generate_sessions(
    studio_id: UUID,
    days: int = Query(14, ge=1, le=90),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    studio = db.query(Studio).filter(Studio.id == studio_id).first()
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    templates = db.query(ClassTemplate).filter(
        ClassTemplate.studio_id == studio_id,
        ClassTemplate.active == True,  # noqa
    ).all()

    if not templates:
        raise HTTPException(status_code=400, detail="No active class templates found")

    now = datetime.now(timezone.utc)
    sessions_created = []

    for day_offset in range(days):
        target_date = now.date() + timedelta(days=day_offset)
        target_weekday = target_date.weekday()  # 0=Monday

        for template in templates:
            if template.weekday != target_weekday:
                continue

            # Parse start_time "HH:MM"
            hour, minute = map(int, template.start_time.split(":"))
            start_at = datetime(
                target_date.year, target_date.month, target_date.day,
                hour, minute, 0, tzinfo=timezone.utc
            )
            end_at = start_at + timedelta(minutes=template.duration_minutes)

            # Skip if session already exists
            existing = db.query(ClassSession).filter(
                ClassSession.template_id == template.id,
                ClassSession.start_at == start_at,
            ).first()

            if existing:
                continue

            session = ClassSession(
                studio_id=studio_id,
                template_id=template.id,
                title=template.title,
                type=template.type,
                instructor=template.instructor,
                capacity=template.capacity,
                start_at=start_at,
                end_at=end_at,
            )
            db.add(session)
            sessions_created.append(session)

    db.commit()
    return APIResponse(
        message=f"Generated {len(sessions_created)} sessions",
        data={"count": len(sessions_created)},
    )
