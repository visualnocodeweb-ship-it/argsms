from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models import Contact, Device, Message, MessageStatus, User
from app.schemas import DashboardStats, ProductInfo
from app.services.httpsms import httpsms

router = APIRouter(prefix="/api", tags=["admin"])


@router.get("/public/product", response_model=ProductInfo)
async def product_info():
    return ProductInfo(
        name="Mensajes ARG",
        tagline="Plataforma de automatización de envío de mensajes",
        description=(
            "Convertí un Android con chip local en una puerta de SMS. "
            "Enviá alertas, recordatorios y avisos masivos sin depender de APIs caras ni de datos del destinatario."
        ),
        features=[
            "Tu propio chip y plan SMS — sin Twilio",
            "Llega aunque el cliente no tenga datos móviles",
            "Ideal para emergencias, municipios, comercios y comunidades",
            "API propia + panel admin para operar el día a día",
            "Integrable con bots, webhooks y WooCommerce",
        ],
        use_cases=[
            {
                "title": "Emergencias / Avisos importantes",
                "items": [
                    "Corte de luz/agua municipal",
                    "Alerta meteorológica",
                    "Seguridad vecinal",
                    "Suspensión de clases",
                ],
            },
            {
                "title": "Negocios / WooCommerce",
                "items": [
                    "Promos flash",
                    "Turnos y recordatorios",
                    "Aviso de stock",
                    "Cobros y vencimientos",
                ],
            },
            {
                "title": "Comunidades / Sociedad",
                "items": [
                    "Comisión vecinal",
                    "Iglesia / ONG",
                    "Mantenimiento de servicios",
                ],
            },
        ],
    )


@router.get("/admin/stats", response_model=DashboardStats)
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    total = await db.scalar(select(func.count()).select_from(Message)) or 0
    sent = await db.scalar(
        select(func.count()).select_from(Message).where(Message.status == MessageStatus.sent.value)
    ) or 0
    pending = await db.scalar(
        select(func.count()).select_from(Message).where(
            Message.status.in_([MessageStatus.pending.value, MessageStatus.queued.value])
        )
    ) or 0
    failed = await db.scalar(
        select(func.count()).select_from(Message).where(Message.status == MessageStatus.failed.value)
    ) or 0
    devices_total = await db.scalar(select(func.count()).select_from(Device)) or 0
    devices_online = await db.scalar(
        select(func.count()).select_from(Device).where(Device.is_online.is_(True))
    ) or 0
    contacts_total = await db.scalar(select(func.count()).select_from(Contact)) or 0

    return DashboardStats(
        total_messages=total,
        sent=sent,
        pending=pending,
        failed=failed,
        devices_online=devices_online,
        devices_total=devices_total,
        contacts_total=contacts_total,
    )


@router.get("/admin/system")
async def system_info(_: User = Depends(get_current_user)):
    return {
        "product": "Mensajes ARG",
        "httpsms_configured": httpsms.configured,
        "httpsms_base_url": settings.httpsms_base_url,
        "mode": "live" if httpsms.configured else "simulation",
    }
