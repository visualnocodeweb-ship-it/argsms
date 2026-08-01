from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.datetime_utils import UtcDateTime
from app.models import Message, MessageStatus, SystemLog, User
from app.services.httpsms import add_log, get_gateway_settings

router = APIRouter(tags=["logs-webhooks"])


class LogOut(BaseModel):
    id: int
    level: str
    source: str
    message: str
    detail: str | None
    created_at: UtcDateTime

    model_config = {"from_attributes": True}


@router.get("/api/logs", response_model=list[LogOut])
async def list_logs(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: int = 100,
):
    result = await db.execute(select(SystemLog).order_by(SystemLog.id.desc()).limit(limit))
    return result.scalars().all()


@router.delete("/api/logs")
async def clear_logs(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (await db.execute(select(SystemLog))).scalars().all()
    for row in rows:
        await db.delete(row)
    await db.commit()
    await add_log(db, level="info", source="system", message="Logs limpiados")
    return {"ok": True}


@router.post("/api/webhooks/httpsms")
async def httpsms_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Recibe eventos CloudEvents de httpSMS (sent/delivered/failed/received)."""
    gw = await get_gateway_settings(db)
    body = await request.json()
    event_type = request.headers.get("X-Event-Type") or body.get("type") or "unknown"
    data = body.get("data") if isinstance(body, dict) else {}
    if not isinstance(data, dict):
        data = {}

    message_id = str(data.get("message_id") or "")
    status_hint = event_type
    detail = str(data)

    level = "info"
    if "failed" in event_type or "expired" in event_type:
        level = "error"
    elif "delivered" in event_type or "sent" in event_type:
        level = "info"
    elif "offline" in event_type:
        level = "warning"

    if message_id:
        result = await db.execute(select(Message).where(Message.external_id == message_id))
        msg = result.scalar_one_or_none()
        if msg:
            if "delivered" in event_type:
                msg.status = MessageStatus.delivered.value
            elif "failed" in event_type or "expired" in event_type:
                msg.status = MessageStatus.failed.value
                msg.error_detail = event_type
            elif "sent" in event_type:
                msg.status = MessageStatus.sent.value
            await db.commit()

    await add_log(
        db,
        level=level,
        source="webhook",
        message=f"Webhook httpSMS: {event_type}",
        detail=detail[:2000],
    )

    # Validación liviana del secreto si vino en query (?secret=)
    secret = request.query_params.get("secret")
    if secret and secret != gw.webhook_secret:
        await add_log(
            db,
            level="warning",
            source="webhook",
            message="Webhook recibido con secret inválido",
            detail=secret[:20],
        )

    return {"ok": True, "event": event_type, "status": status_hint}
