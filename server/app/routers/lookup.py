"""Lookup endpoints for pre-seeded reference data (gender, universities, regions)."""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter()

# 24-hour cache duration for lookup reference data (in seconds)
LOOKUP_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=3600"


@router.get("/genders", response_model=list[schemas.GenderRead])
def list_genders(response: Response, db: Session = Depends(get_db)):
    """Fetch pre-seeded gender options with 24-hour HTTP cache headers."""
    response.headers["Cache-Control"] = LOOKUP_CACHE_CONTROL
    return db.query(models.Gender).order_by(models.Gender.gender_name).all()


@router.get("/universities", response_model=list[schemas.UniversityRead])
def list_universities(response: Response, db: Session = Depends(get_db)):
    """Fetch pre-seeded university options with 24-hour HTTP cache headers."""
    response.headers["Cache-Control"] = LOOKUP_CACHE_CONTROL
    return db.query(models.University).order_by(models.University.university_name).all()


@router.get("/regions", response_model=list[schemas.RegionRead])
def list_regions(response: Response, db: Session = Depends(get_db)):
    """Fetch pre-seeded region options with 24-hour HTTP cache headers."""
    response.headers["Cache-Control"] = LOOKUP_CACHE_CONTROL
    return db.query(models.Region).order_by(models.Region.region_name).all()
