from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas
from app.security import hash_password, get_current_user
from app.cache import profile_cache

router = APIRouter()


@router.post("/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    Atomically inserts into `users` and `users_other_info` in one transaction
    so that a failure in either step rolls back both, keeping the DB consistent.
    """
    # --- uniqueness guard (parameterised → SQL-injection-safe via SQLAlchemy) ---
    if db.query(models.User).filter(
        models.User.user_username == user_in.user_username.strip()
    ).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # --- parse & validate date_of_birth ---
    try:
        dob = datetime.strptime(user_in.date_of_birth.strip(), "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=422, detail="date_of_birth must be YYYY-MM-DD")

    # --- create credentials row ---
    user = models.User(
        user_username=user_in.user_username.strip(),
        user_password=hash_password(user_in.user_password),
    )
    db.add(user)
    db.flush()  # assigns user.user_id without committing yet

    # Determine looking_for_gender_ids from payload (list or single fallback)
    looking_ids = set(user_in.looking_for_gender_ids)
    if user_in.looking_for_gender_id and user_in.looking_for_gender_id not in looking_ids:
        looking_ids.add(user_in.looking_for_gender_id)

    # --- create profile row in same transaction ---
    other_info = models.UserOtherInfo(
        user_id=user.user_id,
        first_name=user_in.first_name.strip(),
        last_name=user_in.last_name.strip(),
        gender_id=user_in.gender_id,
        university_id=user_in.university_id,
        region_id=user_in.region_id,
        looking_for_gender_id=next(iter(looking_ids), None),
        dob=dob,
    )
    db.add(other_info)

    # --- link looking_for_genders ---
    if looking_ids:
        genders_to_link = db.query(models.Gender).filter(models.Gender.gender_id.in_(looking_ids)).all()
        user.looking_for_genders.extend(genders_to_link)

    # --- resolve & link interests (get-or-create by name) ---
    for name in {n.strip().lower() for n in user_in.interests.split(",") if n.strip()}:
        interest = db.query(models.Interest).filter(
            models.Interest.interests_name == name
        ).first()
        if not interest:
            interest = models.Interest(interests_name=name)
            db.add(interest)
            db.flush()
        user.interests.append(interest)

    db.commit()
    db.refresh(user)
    return user


@router.get("/match", response_model=list[schemas.MatchProfile])
def get_match_feed(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns a ranked list of compatible users for the match feed.

    Filtering (hard rules):
      - Exclude the requesting user themselves.
      - Candidate's gender must be in requester's looking_for_genders.
      - Requester's gender must be in candidate's looking_for_genders.
        (mutual preference — both are looking for each other's gender)

    Ranking (soft): descending number of shared interests.
    """
    me = current_user.other_info
    if not me or me.gender_id is None:
        return []

    # Requester's looking-for gender IDs (from many-to-many relationship, with fallback to looking_for_gender_id)
    my_looking_gender_ids = {g.gender_id for g in current_user.looking_for_genders}
    if not my_looking_gender_ids and me.looking_for_gender_id:
        my_looking_gender_ids.add(me.looking_for_gender_id)

    if not my_looking_gender_ids:
        return []

    my_interest_ids = {i.interests_id for i in current_user.interests}

    # Eager-load other_info, interests, and looking_for_genders in query
    candidates = (
        db.query(models.User)
        .options(
            joinedload(models.User.other_info).joinedload(models.UserOtherInfo.university),
            joinedload(models.User.other_info).joinedload(models.UserOtherInfo.region),
            joinedload(models.User.interests),
            joinedload(models.User.looking_for_genders),
        )
        .join(models.UserOtherInfo, models.User.user_id == models.UserOtherInfo.user_id)
        .filter(
            models.User.user_id != current_user.user_id,
            # Candidate's gender matches one of the genders I am looking for
            models.UserOtherInfo.gender_id.in_(my_looking_gender_ids),
        )
        .all()
    )

    # Filter for mutual preference: candidate must also be looking for my gender
    mutual_candidates = []
    for u in candidates:
        candidate_looking_ids = {g.gender_id for g in u.looking_for_genders}
        if not candidate_looking_ids and u.other_info and u.other_info.looking_for_gender_id:
            candidate_looking_ids.add(u.other_info.looking_for_gender_id)
        if me.gender_id in candidate_looking_ids:
            mutual_candidates.append(u)

    result: list[schemas.MatchProfile] = []
    for u in mutual_candidates:
        oi = u.other_info
        shared = len({i.interests_id for i in u.interests} & my_interest_ids)
        result.append(schemas.MatchProfile(
            user_id=u.user_id,
            user_username=u.user_username,
            first_name=oi.first_name,
            last_name=oi.last_name,
            gender_id=oi.gender_id,
            university_id=oi.university_id,
            university_name=oi.university.university_name if oi.university else None,
            region_id=oi.region_id,
            region_name=oi.region.region_name if oi.region else None,
            dob=oi.dob.strftime("%Y-%m-%d") if oi.dob else None,
            interests=[i.interests_name for i in u.interests],
            interest_score=shared,
            is_dnd=u.is_dnd,
            last_active_at=u.last_active_at,
        ))

    # Sort: most shared interests first
    result.sort(key=lambda p: p.interest_score, reverse=True)
    return result


@router.get("/", response_model=list[schemas.UserRead])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=schemas.UserProfile)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Fetch user profile with in-memory LRU+TTL caching (5 minutes)."""
    cached = profile_cache.get(user_id)
    if cached is not None:
        return cached

    user = (
        db.query(models.User)
        .options(
            joinedload(models.User.other_info).joinedload(models.UserOtherInfo.university),
            joinedload(models.User.other_info).joinedload(models.UserOtherInfo.region),
            joinedload(models.User.interests),
            joinedload(models.User.looking_for_genders),
        )
        .filter(models.User.user_id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    oi = user.other_info
    location = (
        (oi.region.region_name if (oi and oi.region) else None)
        or (oi.university.university_location if (oi and oi.university) else None)
    )
    profile = schemas.UserProfile(
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
    profile_cache.set(user_id, profile)
    return profile


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user account and invalidate their cached profile."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile_cache.invalidate(user_id)
    db.delete(user)
    db.commit()
    return None
