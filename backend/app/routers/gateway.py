from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.datetime_utils import UtcDateTime
from app.models import Device, GatewaySettings, Message, MessageStatus, SystemLog, User
from app.services.httpsms import add_log, get_gateway_settings, httpsms, normalize_phone_ar

router = APIRouter(prefix="/api/gateway", tags=["gateway"])


class GatewayConfigIn(BaseModel):
    api_key: str = ""
    from_phone: str = Field(default="", max_length=32)
    webhook_secret: str = Field(default="mensajes-arg-webhook-secret", max_length=255)
    notes: str | None = None


class GatewayConfigOut(BaseModel):
    api_key_set: bool
    api_key_preview: str
    from_phone: str
    webhook_secret: str
    connected: bool
    mode: str
    last_sync_at: UtcDateTime | None
    notes: str | None
    webhook_url: str
    docs: dict


def _preview_key(api_key: str) -> str:
    key = (api_key or "").strip()
    if not key:
        return ""
    if len(key) <= 8:
        return "*" * len(key)
    return f"{key[:4]}…{key[-4:]}"


@router.get("/config", response_model=GatewayConfigOut)
async def get_config(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    gw = await get_gateway_settings(db)
    base = str(request.base_url).rstrip("/")
    return GatewayConfigOut(
        api_key_set=bool(gw.api_key),
        api_key_preview=_preview_key(gw.api_key),
        from_phone=gw.from_phone,
        webhook_secret=gw.webhook_secret,
        connected=gw.connected,
        mode="live" if httpsms.configured else "simulation",
        last_sync_at=gw.last_sync_at,
        notes=gw.notes,
        webhook_url=f"{base}/api/webhooks/httpsms",
        docs={
            "send": "POST https://api.httpsms.com/v1/messages/send",
            "phones": "GET https://api.httpsms.com/v1/phones",
            "auth_header": "x-api-key",
            "guide": "https://docs.httpsms.com",
        },
    )


@router.put("/config", response_model=GatewayConfigOut)
async def save_config(
    payload: GatewayConfigIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    gw = await get_gateway_settings(db)
    if payload.api_key.strip():
        gw.api_key = payload.api_key.strip()
    gw.from_phone = normalize_phone_ar(payload.from_phone)
    if payload.webhook_secret.strip():
        gw.webhook_secret = payload.webhook_secret.strip()
    gw.notes = payload.notes
    httpsms.set_runtime_api_key(gw.api_key)
    await db.commit()
    await db.refresh(gw)

    await add_log(
        db,
        level="info",
        source="gateway",
        message="Configuración de gateway actualizada",
        detail=f"from={gw.from_phone or '-'} key_set={bool(gw.api_key)}",
    )

    base = str(request.base_url).rstrip("/")
    return GatewayConfigOut(
        api_key_set=bool(gw.api_key),
        api_key_preview=_preview_key(gw.api_key),
        from_phone=gw.from_phone,
        webhook_secret=gw.webhook_secret,
        connected=gw.connected,
        mode="live" if httpsms.configured else "simulation",
        last_sync_at=gw.last_sync_at,
        notes=gw.notes,
        webhook_url=f"{base}/api/webhooks/httpsms",
        docs={
            "send": "POST https://api.httpsms.com/v1/messages/send",
            "phones": "GET https://api.httpsms.com/v1/phones",
            "auth_header": "x-api-key",
            "guide": "https://docs.httpsms.com",
        },
    )


@router.post("/connect")
async def connect_phone(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    gw = await get_gateway_settings(db)
    httpsms.set_runtime_api_key(gw.api_key)

    if not httpsms.configured:
        if not gw.from_phone:
            await add_log(
                db,
                level="error",
                source="gateway",
                message="Conexión fallida",
                detail="Falta API key y número from",
            )
            return {
                "ok": False,
                "detail": "Cargá la API key de httpSMS y el número de tu SIM (+54...)",
                "mode": "simulation",
            }
        existing = await db.execute(select(Device).where(Device.phone_number == gw.from_phone))
        device = existing.scalar_one_or_none()
        if not device:
            db.add(
                Device(
                    name="Mi celular (simulación)",
                    phone_number=gw.from_phone,
                    is_online=True,
                    notes="Sin API key: modo simulación local",
                )
            )
        else:
            device.is_online = True
        gw.connected = True
        gw.last_sync_at = datetime.now(timezone.utc)
        await db.commit()
        await add_log(
            db,
            level="warning",
            source="gateway",
            message="Gateway en modo simulación",
            detail=f"from={gw.from_phone}",
        )
        return {
            "ok": True,
            "mode": "simulation",
            "phones_synced": 1,
            "from_phone": gw.from_phone,
            "phones": [],
        }

    result = await httpsms.test_connection()

    if not result.get("ok"):
        gw.connected = False
        await db.commit()
        await add_log(
            db,
            level="error",
            source="gateway",
            message="No se pudo conectar con httpSMS / el celular",
            detail=str(result.get("detail", "error desconocido")),
        )
        return {"ok": False, "detail": result.get("detail"), "mode": result.get("mode")}

    phones = result.get("phones") or []
    synced = 0

    # Apagar dispositivos demo/seed para no usar números inventados
    all_devices = list((await db.execute(select(Device))).scalars().all())
    for device in all_devices:
        device.is_online = False

    # Solo se puede enviar desde un número que la app Android haya registrado en httpSMS.
    configured = normalize_phone_ar(gw.from_phone) if gw.from_phone else ""
    api_numbers: list[str] = []
    preferred = ""
    httpsms_phone_id = ""

    def find_and_dedupe(number: str) -> Device | None:
        matches = [
            d
            for d in list(all_devices)
            if d.phone_number == number or normalize_phone_ar(d.phone_number) == normalize_phone_ar(number)
        ]
        if not matches:
            return None
        matches.sort(key=lambda d: (0 if d.httpsms_id else 1, d.id))
        keep = matches[0]
        for dup in matches[1:]:
            if not keep.httpsms_id and dup.httpsms_id:
                keep.httpsms_id = dup.httpsms_id
            if dup in all_devices:
                all_devices.remove(dup)
            db.delete(dup)
        return keep

    for phone in phones:
        raw = str(phone.get("phone_number") or phone.get("owner") or "").strip()
        number = raw if raw.startswith("+") else normalize_phone_ar(raw)
        if not number:
            continue
        api_numbers.append(number)
        phone_id = str(phone.get("id") or "")
        device = find_and_dedupe(number)
        if not device:
            device = Device(
                name=f"Android {number}",
                phone_number=number,
                httpsms_id=phone_id,
                is_online=True,
                notes="Sincronizado desde httpSMS",
            )
            db.add(device)
            all_devices.append(device)
        else:
            device.phone_number = number
            device.is_online = True
            device.httpsms_id = phone_id or device.httpsms_id or ""
        synced += 1
        if configured and normalize_phone_ar(number) == configured:
            preferred = number
            httpsms_phone_id = phone_id

    # Si el from escrito no coincide con ningún celular de httpSMS, usamos el real de la app.
    if not preferred and api_numbers:
        preferred = api_numbers[0]
        httpsms_phone_id = str(phones[0].get("id") or "") if phones else ""
        if configured and configured != preferred:
            await add_log(
                db,
                level="warning",
                source="gateway",
                message="El from configurado no coincide con el celular de httpSMS",
                detail=f"configurado={configured} real={preferred}. Se usa el de la app.",
            )

    if preferred:
        gw.from_phone = preferred
        device = find_and_dedupe(preferred)
        if not device:
            device = Device(
                name="Mi celular",
                phone_number=preferred,
                httpsms_id=httpsms_phone_id or None,
                is_online=True,
                notes="Sincronizado desde httpSMS",
            )
            db.add(device)
            all_devices.append(device)
            synced = max(synced, 1)
        else:
            device.phone_number = preferred
            device.is_online = True
            if httpsms_phone_id:
                device.httpsms_id = httpsms_phone_id
            synced = max(synced, 1)

    gw.connected = True
    gw.last_sync_at = datetime.now(timezone.utc)
    await db.commit()
    await add_log(
        db,
        level="info",
        source="gateway",
        message="Celular / gateway conectado",
        detail=f"phones_synced={synced} from={gw.from_phone}",
    )
    return {
        "ok": True,
        "mode": "live",
        "phones_synced": synced,
        "from_phone": gw.from_phone,
        "phones": phones,
    }


@router.get("/phones")
async def remote_phones(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    await get_gateway_settings(db)
    try:
        phones = await httpsms.list_phones()
        return {"ok": True, "phones": phones}
    except Exception as exc:  # noqa: BLE001
        await add_log(db, level="error", source="gateway", message="Error listando phones", detail=str(exc))
        return {"ok": False, "detail": str(exc), "phones": []}


@router.get("/message-status/{external_id}")
async def message_status(
    external_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    await get_gateway_settings(db)
    try:
        remote = await httpsms.get_message(external_id)
    except Exception as exc:  # noqa: BLE001
        await add_log(
            db,
            level="error",
            source="gateway",
            message=f"No se pudo consultar mensaje {external_id}",
            detail=str(exc),
        )
        return {"ok": False, "detail": str(exc)}

    status = str(remote.get("status") or "unknown")
    result = await db.execute(select(Message).where(Message.external_id == external_id))
    local = result.scalar_one_or_none()
    if local:
        mapped = status.lower()
        if mapped in {"delivered"}:
            local.status = MessageStatus.delivered.value
        elif mapped in {"failed", "expired", "send-failed", "failed-to-send"}:
            local.status = MessageStatus.failed.value
            local.error_detail = status
        elif mapped in {"sent", "phone-sent"}:
            local.status = MessageStatus.sent.value
        elif mapped in {"pending", "queued"}:
            local.status = MessageStatus.queued.value
        await db.commit()

    await add_log(
        db,
        level="info" if status not in {"failed", "expired"} else "error",
        source="gateway",
        message=f"Estado httpSMS {external_id}: {status}",
        detail=str(remote)[:1500],
    )
    return {"ok": True, "status": status, "data": remote}
