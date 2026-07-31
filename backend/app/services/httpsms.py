from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Device, GatewaySettings, Message, MessageStatus, SystemLog


def normalize_phone_ar(raw: str) -> str:
    """Normaliza a E.164 Argentina (+54...)."""
    value = (raw or "").strip().replace(" ", "").replace("-", "")
    if not value:
        return value
    if value.startswith("00"):
        value = "+" + value[2:]
    if value.startswith("+"):
        digits = "+" + "".join(ch for ch in value[1:] if ch.isdigit())
    else:
        digits = "".join(ch for ch in value if ch.isdigit())
        if digits.startswith("54"):
            digits = "+" + digits
        elif digits.startswith("0") and len(digits) >= 10:
            # 0297... -> +549297...
            digits = "+54" + digits.lstrip("0")
        elif len(digits) == 10:
            # 2972404186 -> +5492972404186 (móvil AR suele llevar 9)
            digits = "+549" + digits
        elif len(digits) == 11 and digits.startswith("9"):
            digits = "+54" + digits
        else:
            digits = "+54" + digits
    # Asegurar 9 de móvil si viene +54 + área + número sin 9
    if digits.startswith("+54") and not digits.startswith("+549") and len(digits) >= 12:
        digits = "+549" + digits[3:]
    return digits


async def add_log(
    db: AsyncSession,
    *,
    level: str,
    source: str,
    message: str,
    detail: str | None = None,
) -> None:
    db.add(SystemLog(level=level, source=source, message=message, detail=detail))
    await db.commit()


class HttpSMSClient:
    """Cliente hacia la API de httpSMS. Si no hay API key, opera en modo simulación."""

    def __init__(self) -> None:
        self.base_url = settings.httpsms_base_url.rstrip("/")
        self._runtime_api_key: str | None = None

    def set_runtime_api_key(self, api_key: str | None) -> None:
        self._runtime_api_key = api_key or None

    @property
    def api_key(self) -> str:
        return (self._runtime_api_key or settings.httpsms_api_key or "").strip()

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def send_sms(self, from_phone: str, to_phone: str, content: str) -> dict:
        from_phone = normalize_phone_ar(from_phone)
        to_phone = normalize_phone_ar(to_phone)

        if not self.configured:
            return {
                "id": f"sim-{datetime.now(timezone.utc).timestamp()}",
                "status": "sent",
                "simulated": True,
                "from": from_phone,
                "to": to_phone,
            }

        payload = {"content": content, "from": from_phone, "to": to_phone}
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/v1/messages/send",
                json=payload,
                headers=self._headers(),
            )
            if response.is_error:
                detail = response.text
                try:
                    body = response.json()
                    detail = str(body.get("message") or body.get("data") or body)
                except Exception:  # noqa: BLE001
                    pass
                raise httpx.HTTPStatusError(
                    f"httpSMS {response.status_code}: {detail} | payload={payload}",
                    request=response.request,
                    response=response,
                )
            data = response.json()
            return data.get("data", data)

    async def get_message(self, message_id: str) -> dict:
        if not self.configured:
            return {"id": message_id, "status": "simulated"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/v1/messages/{message_id}",
                headers=self._headers(),
            )
            if response.is_error:
                detail = response.text
                try:
                    body = response.json()
                    detail = str(body.get("message") or body)
                except Exception:  # noqa: BLE001
                    pass
                raise httpx.HTTPStatusError(
                    f"httpSMS {response.status_code}: {detail}",
                    request=response.request,
                    response=response,
                )
            data = response.json()
            return data.get("data", data)

    async def list_phones(self) -> list[dict]:
        if not self.configured:
            return []
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/v1/phones",
                params={"skip": 0, "limit": 50},
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()
            phones = data.get("data", data)
            return phones if isinstance(phones, list) else []

    async def test_connection(self) -> dict:
        if not self.configured:
            return {"ok": False, "mode": "simulation", "detail": "Falta API key de httpSMS"}
        try:
            phones = await self.list_phones()
            return {
                "ok": True,
                "mode": "live",
                "phones_count": len(phones),
                "phones": phones,
            }
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "mode": "live", "detail": str(exc)}


httpsms = HttpSMSClient()


async def get_gateway_settings(db: AsyncSession) -> GatewaySettings:
    result = await db.execute(select(GatewaySettings).limit(1))
    row = result.scalar_one_or_none()
    if row:
        httpsms.set_runtime_api_key(row.api_key)
        return row
    row = GatewaySettings(
        api_key=settings.httpsms_api_key,
        webhook_secret="mensajes-arg-webhook-secret",
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    httpsms.set_runtime_api_key(row.api_key)
    return row


async def dispatch_message(db: AsyncSession, message: Message) -> Message:
    gw = await get_gateway_settings(db)

    device: Device | None = None
    from_phone = normalize_phone_ar(gw.from_phone) if gw.from_phone else ""

    if message.device_id:
        result = await db.execute(select(Device).where(Device.id == message.device_id))
        device = result.scalar_one_or_none()
        if device and not from_phone:
            from_phone = normalize_phone_ar(device.phone_number)
    elif from_phone:
        result = await db.execute(select(Device).where(Device.phone_number == from_phone))
        device = result.scalar_one_or_none()
        if not device:
            # buscar por coincidencia parcial normalizada
            devices = (await db.execute(select(Device))).scalars().all()
            for candidate in devices:
                if normalize_phone_ar(candidate.phone_number) == from_phone:
                    device = candidate
                    break
    else:
        result = await db.execute(select(Device).where(Device.is_online.is_(True)).limit(1))
        device = result.scalar_one_or_none()
        if device:
            from_phone = normalize_phone_ar(device.phone_number)

    if not from_phone:
        message.status = MessageStatus.failed.value
        message.error_detail = "No hay número de origen. Conectá tu celular en el dashboard."
        await db.commit()
        await add_log(
            db,
            level="error",
            source="send",
            message="Envío fallido: falta número de origen",
            detail=message.error_detail,
        )
        await db.refresh(message)
        return message

    if device:
        message.device_id = device.id
    message.status = MessageStatus.queued.value
    await db.commit()

    try:
        result = await httpsms.send_sms(from_phone, message.to_phone, message.content)
        message.external_id = str(result.get("id", ""))
        message.status = MessageStatus.sent.value
        message.sent_at = datetime.now(timezone.utc)
        message.error_detail = None
        if result.get("simulated"):
            message.error_detail = "Enviado en modo simulación (sin API key de httpSMS)"
            await add_log(
                db,
                level="warning",
                source="send",
                message=f"SMS simulado a {message.to_phone}",
                detail=message.content[:200],
            )
        else:
            await add_log(
                db,
                level="info",
                source="send",
                message=f"SMS encolado hacia {message.to_phone}",
                detail=f"from={from_phone} external_id={message.external_id}",
            )
    except Exception as exc:  # noqa: BLE001
        message.status = MessageStatus.failed.value
        message.error_detail = str(exc)
        await add_log(
            db,
            level="error",
            source="send",
            message=f"Error al enviar SMS a {message.to_phone}",
            detail=str(exc),
        )

    await db.commit()
    await db.refresh(message)
    return message
