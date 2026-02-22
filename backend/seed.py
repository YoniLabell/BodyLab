#!/usr/bin/env python3
"""Seed script: creates demo studio with class templates and generates 14 days of sessions."""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta, timezone
from app.db.session import SessionLocal, engine, Base
from app.db.models import Studio, ClassTemplate, ClassSession, User
from app.core.security import get_password_hash


def seed():
    db = SessionLocal()
    try:
        # Create tables if they don't exist (for dev without alembic)
        Base.metadata.create_all(bind=engine)

        # Create demo studio
        studio = db.query(Studio).filter(Studio.slug == "bodylab-demo").first()
        if not studio:
            studio = Studio(
                name="BodyLab Studio",
                slug="bodylab-demo",
                timezone="America/New_York",
                description="Premium fitness studio offering yoga, HIIT, and pilates classes.",
            )
            db.add(studio)
            db.flush()
            print(f"Created studio: {studio.name} (slug: {studio.slug})")
        else:
            print(f"Studio already exists: {studio.slug}")

        # Create admin user
        admin = db.query(User).filter(User.email == "admin@bodylab.com").first()
        if not admin:
            admin = User(
                email="admin@bodylab.com",
                password_hash=get_password_hash("admin1234"),
                name="Admin User",
                is_admin=True,
            )
            db.add(admin)
            print("Created admin user: admin@bodylab.com / admin1234")

        # Create demo user
        demo_user = db.query(User).filter(User.email == "demo@bodylab.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@bodylab.com",
                password_hash=get_password_hash("demo1234"),
                name="Demo User",
                is_admin=False,
            )
            db.add(demo_user)
            print("Created demo user: demo@bodylab.com / demo1234")

        db.flush()

        # Create class templates
        templates_data = [
            # Yoga - Monday, Wednesday, Friday at 7:00 AM
            {"title": "Morning Vinyasa Flow", "type": "Yoga", "instructor": "Sarah Chen", "capacity": 15, "weekday": 0, "start_time": "07:00", "duration_minutes": 60},
            {"title": "Morning Vinyasa Flow", "type": "Yoga", "instructor": "Sarah Chen", "capacity": 15, "weekday": 2, "start_time": "07:00", "duration_minutes": 60},
            {"title": "Morning Vinyasa Flow", "type": "Yoga", "instructor": "Sarah Chen", "capacity": 15, "weekday": 4, "start_time": "07:00", "duration_minutes": 60},

            # HIIT - Tuesday, Thursday at 6:00 AM
            {"title": "Power HIIT", "type": "HIIT", "instructor": "Marcus Rivera", "capacity": 20, "weekday": 1, "start_time": "06:00", "duration_minutes": 45},
            {"title": "Power HIIT", "type": "HIIT", "instructor": "Marcus Rivera", "capacity": 20, "weekday": 3, "start_time": "06:00", "duration_minutes": 45},

            # Pilates - Mon, Wed at 9:00 AM
            {"title": "Core Pilates", "type": "Pilates", "instructor": "Emma Walsh", "capacity": 12, "weekday": 0, "start_time": "09:00", "duration_minutes": 55},
            {"title": "Core Pilates", "type": "Pilates", "instructor": "Emma Walsh", "capacity": 12, "weekday": 2, "start_time": "09:00", "duration_minutes": 55},

            # Spin - Mon, Wed, Fri at 6:30 AM
            {"title": "Spin & Burn", "type": "Cycling", "instructor": "Jake Thompson", "capacity": 18, "weekday": 0, "start_time": "06:30", "duration_minutes": 45},
            {"title": "Spin & Burn", "type": "Cycling", "instructor": "Jake Thompson", "capacity": 18, "weekday": 2, "start_time": "06:30", "duration_minutes": 45},
            {"title": "Spin & Burn", "type": "Cycling", "instructor": "Jake Thompson", "capacity": 18, "weekday": 4, "start_time": "06:30", "duration_minutes": 45},

            # Strength - Tue, Thu, Sat at 8:00 AM
            {"title": "Strength & Conditioning", "type": "Strength", "instructor": "Marcus Rivera", "capacity": 16, "weekday": 1, "start_time": "08:00", "duration_minutes": 60},
            {"title": "Strength & Conditioning", "type": "Strength", "instructor": "Marcus Rivera", "capacity": 16, "weekday": 3, "start_time": "08:00", "duration_minutes": 60},
            {"title": "Strength & Conditioning", "type": "Strength", "instructor": "Marcus Rivera", "capacity": 16, "weekday": 5, "start_time": "08:00", "duration_minutes": 60},

            # Evening yoga - Tue, Thu at 6:00 PM
            {"title": "Restorative Yoga", "type": "Yoga", "instructor": "Aisha Patel", "capacity": 15, "weekday": 1, "start_time": "18:00", "duration_minutes": 75},
            {"title": "Restorative Yoga", "type": "Yoga", "instructor": "Aisha Patel", "capacity": 15, "weekday": 3, "start_time": "18:00", "duration_minutes": 75},

            # Barre - Sat, Sun at 10:00 AM
            {"title": "Ballet Barre Fusion", "type": "Barre", "instructor": "Emma Walsh", "capacity": 14, "weekday": 5, "start_time": "10:00", "duration_minutes": 60},
            {"title": "Ballet Barre Fusion", "type": "Barre", "instructor": "Emma Walsh", "capacity": 14, "weekday": 6, "start_time": "10:00", "duration_minutes": 60},
        ]

        existing_templates = db.query(ClassTemplate).filter(ClassTemplate.studio_id == studio.id).count()
        templates = []
        if existing_templates == 0:
            for td in templates_data:
                t = ClassTemplate(studio_id=studio.id, **td)
                db.add(t)
                templates.append(t)
            db.flush()
            print(f"Created {len(templates)} class templates")
        else:
            templates = db.query(ClassTemplate).filter(ClassTemplate.studio_id == studio.id).all()
            print(f"Using existing {len(templates)} class templates")

        # Generate sessions for next 21 days
        now = datetime.now(timezone.utc)
        sessions_created = 0

        for day_offset in range(21):
            target_date = now.date() + timedelta(days=day_offset)
            target_weekday = target_date.weekday()

            for template in templates:
                if template.weekday != target_weekday:
                    continue

                hour, minute = map(int, template.start_time.split(":"))
                start_at = datetime(
                    target_date.year, target_date.month, target_date.day,
                    hour, minute, 0, tzinfo=timezone.utc
                )
                end_at = start_at + timedelta(minutes=template.duration_minutes)

                existing = db.query(ClassSession).filter(
                    ClassSession.template_id == template.id,
                    ClassSession.start_at == start_at,
                ).first()

                if existing:
                    continue

                session = ClassSession(
                    studio_id=studio.id,
                    template_id=template.id,
                    title=template.title,
                    type=template.type,
                    instructor=template.instructor,
                    capacity=template.capacity,
                    start_at=start_at,
                    end_at=end_at,
                )
                db.add(session)
                sessions_created += 1

        db.commit()
        print(f"Generated {sessions_created} sessions")
        print("\nSeed complete!")
        print(f"  Studio slug: bodylab-demo")
        print(f"  Admin: admin@bodylab.com / admin1234")
        print(f"  Demo:  demo@bodylab.com / demo1234")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
