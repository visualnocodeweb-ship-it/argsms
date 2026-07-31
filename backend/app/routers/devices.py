from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Device, User
from app.schemas import DeviceCreate, DeviceOut

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("", response_model=list[DeviceOut])
async def list_devices(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Device).order_by(Device.id.desc()))
    return result.scalars().all()


@router.post("", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
async def create_device(
    payload: DeviceCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    device = Device(**payload.model_dump())
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return device


@router.patch("/{device_id}/toggle", response_model=DeviceOut)
async def toggle_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    device.is_online = not device.is_online
    await db.commit()
    await db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    await db.delete(device)
    await db.commit()
