"""Direct messaging router.

Provides endpoints to:
- Send direct messages between scholars
- Retrieve conversation threads
- List conversations with last message and unread counts
- Track unread message totals
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.database import get_db
from app import models, schemas
from app.security import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: schemas.MessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a direct message to another user.

    Validations:
    - Message content must not be blank.
    - Requester cannot send a message to themselves.
    - Target receiver must exist in the database.
    """
    content = payload.msg_content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty",
        )

    if payload.receiver_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send a message to yourself",
        )

    receiver = db.query(models.User).filter(models.User.user_id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient user not found",
        )

    message = models.Message(
        sender_id=current_user.user_id,
        receiver_id=payload.receiver_id,
        msg_content=content,
        is_read=False,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/unread-count", response_model=schemas.UnreadCount)
def get_unread_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the total number of unread incoming messages for the logged-in user.
    """
    count = (
        db.query(models.Message)
        .filter(
            models.Message.receiver_id == current_user.user_id,
            models.Message.is_read == False,  # noqa: E712
        )
        .count()
    )
    return {"unread_count": count}


@router.get("/conversations", response_model=list[schemas.ConversationSummary])
def list_conversations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch all conversations involving the logged-in user.

    Each conversation summary includes:
    - Partner's identification and display name
    - The most recent message preview and timestamp
    - The count of unread messages sent by that partner to the logged-in user
    """
    # Fetch all messages involving current user, ordered latest first
    messages = (
        db.query(models.Message)
        .filter(
            or_(
                models.Message.sender_id == current_user.user_id,
                models.Message.receiver_id == current_user.user_id,
            )
        )
        .order_by(desc(models.Message.message_timestamp), desc(models.Message.message_id))
        .all()
    )

    # Group by partner id
    partner_ids = []
    latest_by_partner = {}
    unread_by_partner = {}

    for msg in messages:
        partner_id = msg.receiver_id if msg.sender_id == current_user.user_id else msg.sender_id
        if partner_id not in latest_by_partner:
            latest_by_partner[partner_id] = msg
            partner_ids.append(partner_id)
            unread_by_partner[partner_id] = 0

        # If incoming message and not read, increment partner unread count
        if msg.receiver_id == current_user.user_id and not msg.is_read:
            unread_by_partner[partner_id] = unread_by_partner.get(partner_id, 0) + 1

    if not partner_ids:
        return []

    # Batch query partner user records with other_info
    partners = (
        db.query(models.User)
        .filter(models.User.user_id.in_(partner_ids))
        .all()
    )
    partner_map = {p.user_id: p for p in partners}

    conversations = []
    for pid in partner_ids:
        partner = partner_map.get(pid)
        if not partner:
            continue
        last_msg = latest_by_partner[pid]
        first_name = partner.other_info.first_name if partner.other_info else ""
        last_name = partner.other_info.last_name if partner.other_info else ""

        conversations.append(
            schemas.ConversationSummary(
                user_id=partner.user_id,
                user_username=partner.user_username,
                first_name=first_name,
                last_name=last_name,
                last_message=last_msg.msg_content,
                last_timestamp=last_msg.message_timestamp,
                unread_count=unread_by_partner.get(pid, 0),
            )
        )

    return conversations


@router.get("/{other_user_id}", response_model=list[schemas.MessageRead])
def get_thread(
    other_user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve message history between the logged-in user and another user.
    Automatically marks unread messages from this partner as read.
    """
    # Mark incoming unread messages as read
    db.query(models.Message).filter(
        models.Message.sender_id == other_user_id,
        models.Message.receiver_id == current_user.user_id,
        models.Message.is_read == False,  # noqa: E712
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()

    # Query full thread ordered chronologically
    thread = (
        db.query(models.Message)
        .filter(
            or_(
                and_(
                    models.Message.sender_id == current_user.user_id,
                    models.Message.receiver_id == other_user_id,
                ),
                and_(
                    models.Message.sender_id == other_user_id,
                    models.Message.receiver_id == current_user.user_id,
                ),
            )
        )
        .order_by(models.Message.message_timestamp.asc(), models.Message.message_id.asc())
        .all()
    )
    return thread
