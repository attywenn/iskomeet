"""Lookup endpoints for pre-seeded reference data (gender, universities, regions)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter()


@router.get("/genders", response_model=list[schemas.GenderRead])
def list_genders(db: Session = Depends(get_db)):
    return db.query(models.Gender).order_by(models.Gender.gender_name).all()


@router.get("/universities", response_model=list[schemas.UniversityRead])
def list_universities(db: Session = Depends(get_db)):
    return db.query(models.University).order_by(models.University.university_name).all()


@router.get("/regions", response_model=list[schemas.RegionRead])
def list_regions(db: Session = Depends(get_db)):
    return db.query(models.Region).order_by(models.Region.region_name).all()
