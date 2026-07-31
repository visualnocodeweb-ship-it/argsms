from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Message, User
from app.schemas import BulkMessageCreate, MessageCreate, MessageOut
from app.services.httpsms import dispatch_message

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("", response_model=list[MessageOut])
async def list_messages(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: int = 100,
):
    result = await db.execute(select(Message).order_by(Message.id.desc()).limit(limit))
    return result.scalars().all()


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    message = Message(**payload.model_dump())
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return await dispatch_message(db, message)


@router.post("/bulk", response_model=list[MessageOut], status_code=status.HTTP_201_CREATED)
async def send_bulk(
    payload: BulkMessageCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    sent: list[Message] = []
    for phone in payload.phones:
        message = Message(
            to_phone=phone.strip(),
            content=payload.content,
            category=payload.category,
            device_id=payload.device_id,
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        sent.append(await dispatch_message(db, message))
    return sent


@router.get("/{message_id}", response_model=MessageOut)
async def get_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Message).where(Message.id == message_id))
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    return message
