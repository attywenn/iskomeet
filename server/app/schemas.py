"""Pydantic schemas for request/response validation.
"""
from datetime import datetime
from pydantic import BaseModel

# ---------- Lookup (reference data) ----------
class GenderRead(BaseModel):
    gender_id: int
    gender_name: str

    class Config:
        from_attributes = True

class UniversityRead(BaseModel):
    university_number: int
    university_name: str
    university_location: str

    class Config:
        from_attributes = True

class RegionRead(BaseModel):
    region_id: int
    region_name: str

    class Config:
        from_attributes = True



# ---------- User ----------
class UserBase(BaseModel):
    user_username: str

class UserCreate(UserBase):
    """Full registration payload — credentials + profile details."""
    user_password: str
    first_name: str
    last_name: str
    gender_id: int
    university_id: int
    region_id: int
    looking_for_gender_ids: list[int] = []  # gender_ids of preferred genders to date
    looking_for_gender_id: int | None = None  # fallback for single-select backwards compatibility
    interests: str              # comma-separated, e.g. "coding,music,chess"
    date_of_birth: str          # ISO date string, e.g. "2001-05-14"

class UserRead(UserBase):
    user_id: int
    account_created: datetime

    class Config:
        from_attributes = True

class MatchProfile(BaseModel):
    """Serialised user card returned by the match feed."""
    user_id: int
    user_username: str
    first_name: str
    last_name: str
    gender_id: int | None = None
    university_id: int | None = None
    university_name: str | None = None
    region_id: int | None = None
    region_name: str | None = None
    dob: str | None = None
    interests: list[str] = []
    interest_score: int = 0     # number of shared interests with the requesting user
    is_dnd: bool = False
    last_active_at: datetime | None = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    user_username: str
    user_password: str

class UserProfile(BaseModel):
    user_id: int
    user_username: str
    first_name: str
    last_name: str
    gender: str | None = None
    gender_id: int | None = None
    looking_for_genders: list[str] = []
    looking_for_gender_ids: list[int] = []
    university: str | None = None
    location: str | None = None
    interests: list[str] = []
    is_dnd: bool = False
    last_active_at: datetime | None = None

class PresenceUpdate(BaseModel):
    is_dnd: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class TokenData(BaseModel):
    user_id: int | None = None
    username: str | None = None

# ---------- UserOtherInfo ----------
class UserOtherInfoBase(BaseModel):
    first_name: str
    last_name: str
    gender_id: int | None = None
    university_id: int | None = None
    region_id: int | None = None
    looking_for_gender_id: int | None = None
    dob: str | None = None

class UserOtherInfoRead(UserOtherInfoBase):
    user_oi_id: int
    user_id: int

    class Config:
        from_attributes = True

# ---------- Interest ----------
class InterestBase(BaseModel):
    interests_name: str

class InterestCreate(InterestBase):
    pass

class InterestRead(InterestBase):
    interests_id: int

    class Config:
        from_attributes = True

# ---------- Message ----------
class MessageCreate(BaseModel):
    receiver_id: int
    msg_content: str

class MessageRead(BaseModel):
    message_id: int
    msg_content: str
    sender_id: int
    receiver_id: int
    message_timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True

class ConversationSummary(BaseModel):
    user_id: int
    user_username: str
    first_name: str
    last_name: str
    last_message: str
    last_timestamp: datetime
    unread_count: int

class UnreadCount(BaseModel):
    unread_count: int

