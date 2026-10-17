from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import verify_password, create_access_token, get_current_user

router = APIRouter()


def serialize_user_profile(user: models.User) -> schemas.UserProfile:
    """Extract profile fields directly from the User ORM relationships."""
    oi = user.other_info
    location = (oi.region.region_name if (oi and oi.region) else None) or (oi.university.university_location if (oi and oi.university) else None)
    return schemas.UserProfile(
        user_id=user.user_id,
        user_username=user.user_username,
        first_name=oi.first_name if oi else "",
        last_name=oi.last_name if oi else "",
        gender=oi.gender.gender_name if (oi and oi.gender) else None,
        gender_id=oi.gender_id if oi else None,
        looking_for_genders=[g.gender_name for g in user.looking_for_genders] if user.looking_for_genders else [],
        looking_for_gender_ids=[g.gender_id for g in user.looking_for_genders] if user.looking_for_genders else [],
        university=oi.university.university_name if (oi and oi.university) else None,
        location=location,
        interests=[i.interests_name for i in user.interests] if user.interests else [],
        is_dnd=user.is_dnd,
        last_active_at=user.last_active_at,
    )


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_username == credentials.user_username.strip()).first()
    if not user or not verify_password(credentials.user_password, user.user_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.user_id), "username": user.user_username}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user_profile(user),
    }


@router.get("/me", response_model=schemas.UserProfile)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return serialize_user_profile(current_user)


@router.put("/presence", response_model=schemas.UserProfile)
def update_presence(
    presence: schemas.PresenceUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the signed-in user's discoverable DND status and activity time."""
    current_user.is_dnd = presence.is_dnd
    current_user.last_active_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return serialize_user_profile(current_user)


@router.post("/heartbeat", response_model=schemas.UserProfile)
def presence_heartbeat(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Refresh activity for an active user; DND users keep their last-active time."""
    if not current_user.is_dnd:
        current_user.last_active_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(current_user)
    return serialize_user_profile(current_user)
