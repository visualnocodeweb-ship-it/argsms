from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Contact, User
from app.schemas import ContactCreate, ContactOut

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("", response_model=list[ContactOut])
async def list_contacts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Contact).order_by(Contact.id.desc()))
    return result.scalars().all()


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
async def create_contact(
    payload: ContactCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    contact = Contact(**payload.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    await db.delete(contact)
    await db.commit()
