# file:///home/attywenn/Desktop/Iskomeet/server/app/models.py
"""SQLAlchemy ORM models for the Supabase schema.
Each table mirrors the CREATE TABLE statements you provided.
Relationships are declared for convenient navigation.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# Association table for many‑to‑many user <-> interests
user_interests = Table(
    "user_interests",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True),
    Column("interests_id", Integer, ForeignKey("interests.interests_id", ondelete="CASCADE"), primary_key=True),
)

# Association table for many-to-many user <-> looking_for_genders
user_looking_for_genders = Table(
    "user_looking_for_genders",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True),
    Column("gender_id", Integer, ForeignKey("gender.gender_id", ondelete="CASCADE"), primary_key=True),
)


class Gender(Base):
    __tablename__ = "gender"
    gender_id = Column(Integer, primary_key=True, index=True)
    gender_name = Column(String(255), nullable=False)
    # reverse relationship
    users_other_info = relationship("UserOtherInfo", foreign_keys="[UserOtherInfo.gender_id]", back_populates="gender")
    looking_users = relationship("User", secondary=user_looking_for_genders, back_populates="looking_for_genders")


class University(Base):
    __tablename__ = "universities"
    university_number = Column(Integer, primary_key=True, index=True)
    university_name = Column(String(255), nullable=False)
    university_location = Column(String(255), nullable=False)

    users_other_info = relationship("UserOtherInfo", back_populates="university")


class Interest(Base):
    __tablename__ = "interests"
    interests_id = Column(Integer, primary_key=True, index=True)
    interests_name = Column(String(255), nullable=False, unique=True)

    users = relationship("User", secondary=user_interests, back_populates="interests")

class Region(Base):
    __tablename__ = "region"
    region_id = Column(Integer, primary_key=True, index=True)
    region_name = Column(Text, nullable=False, unique=True)

    users_other_info = relationship("UserOtherInfo", back_populates="region")

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    user_username = Column(String(255), unique=True, nullable=False)
    user_password = Column(String(255), nullable=False)
    account_created = Column(DateTime(timezone=True), server_default=func.now())
    is_dnd = Column(Boolean, nullable=False, default=False, server_default="false")
    last_active_at = Column(DateTime(timezone=True), nullable=True)

    other_info = relationship("UserOtherInfo", uselist=False, back_populates="user", cascade="all, delete-orphan")
    interests = relationship("Interest", secondary=user_interests, back_populates="users")
    looking_for_genders = relationship("Gender", secondary=user_looking_for_genders, back_populates="looking_users")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender", cascade="all, delete-orphan")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver", cascade="all, delete-orphan")


class UserOtherInfo(Base):
    __tablename__ = "users_other_info"
    user_oi_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, unique=True)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    gender_id = Column(Integer, ForeignKey("gender.gender_id"))
    university_id = Column(Integer, ForeignKey("universities.university_number"))
    region_id = Column(Integer, ForeignKey("region.region_id"))
    looking_for_gender_id = Column(Integer, ForeignKey("gender.gender_id"))  # preferred gender to date
    dob = Column(DateTime, index=True)

    user = relationship("User", back_populates="other_info")
    gender = relationship("Gender", foreign_keys=[gender_id], back_populates="users_other_info")
    looking_for_gender = relationship("Gender", foreign_keys=[looking_for_gender_id])
    university = relationship("University", back_populates="users_other_info")
    region = relationship("Region", back_populates="users_other_info")


class Message(Base):
    __tablename__ = "messages"
    message_id = Column(Integer, primary_key=True, index=True)
    msg_content = Column(Text, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    message_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_read = Column(Boolean, default=False, nullable=False, server_default="false")

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
