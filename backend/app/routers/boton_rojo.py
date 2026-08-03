import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.datetime_utils import UtcDateTime
from app.models import (
    BotonRojoAlert,
    BotonRojoSettings,
    Contact,
    Message,
    Project,
    User,
)
from app.services.httpsms import add_log, dispatch_message, normalize_phone_ar

router = APIRouter(tags=["boton-rojo"])

EQUIPO_GROUP = "Equipo de alerta"
RED_GROUP = "Red Comunitaria"
PROJECT_SLUG = "boton-rojo"


class PersonaAConfig(BaseModel):
    persona_a_phone: str
    project_id: int
    project_name: str
    avisar_equipo_hint: str


class PersonaAUpdate(BaseModel):
    persona_a_phone: str = Field(min_length=8, max_length=32)


class EquipoMemberIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=8, max_length=32)
    institution: str | None = Field(default=None, max_length=120)


class EquipoMemberOut(BaseModel):
    id: int
    name: str
    phone: str
    institution: str | None
    created_at: UtcDateTime

    model_config = {"from_attributes": True}


class PublicAlertaIn(BaseModel):
    phone: str = Field(min_length=8, max_length=32)
    name: str | None = Field(default=None, max_length=120)


class PublicAlertaOut(BaseModel):
    ok: bool
    detail: str
    alert_id: int | None = None


class AntecedenteMessageOut(BaseModel):
    id: int
    to_phone: str
    to_name: str | None = None
    to_institution: str | None = None
    content: str
    status: str
    category: str | None
    error_detail: str | None
    created_at: UtcDateTime
    sent_at: UtcDateTime | None


class AntecedenteOut(BaseModel):
    id: int
    requester_phone: str
    requester_name: str | None
    status: str
    created_at: UtcDateTime
    notified_at: UtcDateTime | None
    team_alerted_at: UtcDateTime | None
    persona_a_enviada: bool
    equipo_enviado: bool
    equipo_sms_enviados: int
    equipo_sms_fallidos: int
    messages: list[AntecedenteMessageOut]


async def _get_boton_project(db: AsyncSession) -> Project:
    result = await db.execute(select(Project).where(Project.slug == PROJECT_SLUG))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto Botón Rojo no encontrado")
    return project


async def _get_or_create_settings(db: AsyncSession, project_id: int) -> BotonRojoSettings:
    result = await db.execute(
        select(BotonRojoSettings).where(BotonRojoSettings.project_id == project_id)
    )
    row = result.scalar_one_or_none()
    if row:
        return row
    row = BotonRojoSettings(project_id=project_id, persona_a_phone="")
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def _list_group_members(db: AsyncSession, project_id: int, group_name: str) -> list[Contact]:
    result = await db.execute(
        select(Contact)
        .where(Contact.project_id == project_id, Contact.group_name == group_name)
        .order_by(Contact.id.desc())
    )
    return list(result.scalars().all())


async def _ensure_red_members(db: AsyncSession, project: Project) -> list[Contact]:
    """Lista Red Comunitaria; si está vacía, migra el celular legacy de settings."""
    members = await _list_group_members(db, project.id, RED_GROUP)
    if members:
        return members
    cfg = await _get_or_create_settings(db, project.id)
    legacy = normalize_phone_ar(cfg.persona_a_phone or "")
    if not legacy:
        return []
    contact = Contact(
        project_id=project.id,
        name="Red Comunitaria",
        phone=legacy,
        group_name=RED_GROUP,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return [contact]


@router.get("/api/projects/{project_id}/boton-rojo/persona-a", response_model=PersonaAConfig)
async def get_persona_a(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Compat: primer celular de Red Comunitaria (la UI nueva usa /red-comunitaria)."""
    project = await _get_boton_project(db)
    if project.id != project_id:
        raise HTTPException(status_code=400, detail="Este endpoint es solo para Botón Rojo")
    members = await _ensure_red_members(db, project)
    phone = members[0].phone if members else ""
    return PersonaAConfig(
        persona_a_phone=phone,
        project_id=project.id,
        project_name=project.name,
        avisar_equipo_hint=(
            "Cuando llega un formulario, cada persona de Red Comunitaria recibe un SMS "
            "con un link para avisar al Equipo de alerta."
        ),
    )


@router.put("/api/projects/{project_id}/boton-rojo/persona-a", response_model=PersonaAConfig)
async def save_persona_a(
    project_id: int,
    payload: PersonaAUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Compat: agrega/actualiza el primer miembro de Red Comunitaria."""
    project = await _get_boton_project(db)
    if project.id != project_id:
        raise HTTPException(status_code=400, detail="Este endpoint es solo para Botón Rojo")
    phone = normalize_phone_ar(payload.persona_a_phone)
    members = await _ensure_red_members(db, project)
    cfg = await _get_or_create_settings(db, project.id)
    cfg.persona_a_phone = phone
    cfg.updated_at = datetime.now(timezone.utc)
    if members:
        members[0].phone = phone
    else:
        db.add(
            Contact(
                project_id=project.id,
                name="Red Comunitaria",
                phone=phone,
                group_name=RED_GROUP,
            )
        )
    await db.commit()
    await add_log(
        db,
        level="info",
        source="boton-rojo",
        message="Celular Red Comunitaria actualizado",
        detail=phone,
    )
    return PersonaAConfig(
        persona_a_phone=phone,
        project_id=project.id,
        project_name=project.name,
        avisar_equipo_hint=(
            "Cuando llega un formulario, cada persona de Red Comunitaria recibe un SMS "
            "con un link para avisar al Equipo de alerta."
        ),
    )


@router.get(
    "/api/projects/{project_id}/boton-rojo/red-comunitaria",
    response_model=list[EquipoMemberOut],
)
async def list_red_comunitaria(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = await _get_boton_project(db)
    if project.id != project_id:
        raise HTTPException(status_code=400, detail="Este endpoint es solo para Botón Rojo")
    return await _ensure_red_members(db, project)


@router.post(
    "/api/projects/{project_id}/boton-rojo/red-comunitaria",
    response_model=EquipoMemberOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_red_comunitaria_member(
    project_id: int,
    payload: EquipoMemberIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = await _get_boton_project(db)
    if project.id != project_id:
        raise HTTPException(status_code=400, detail="Este endpoint es solo para Botón Rojo")
    contact = Contact(
        project_id=project.id,
        name=payload.name.strip(),
        phone=normalize_phone_ar(payload.phone),
        group_name=RED_GROUP,
        institution=(payload.institution or "").strip() or None,
    )
    db.add(contact)
    cfg = await _get_or_create_settings(db, project.id)
    if not (cfg.persona_a_phone or "").strip():
        cfg.persona_a_phone = contact.phone
        cfg.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contact)
    await add_log(
        db,
        level="info",
        source="boton-rojo",
        message=f"Miembro agregado a Red Comunitaria: {contact.name}",
        detail=f"{contact.phone} · {contact.institution or '-'}",
    )
    return contact


@router.delete(
    "/api/projects/{project_id}/boton-rojo/red-comunitaria/{member_id}",
    status_code=204,
)
async def delete_red_comunitaria_member(
    project_id: int,
    member_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = await _get_boton_project(db)
    if project.id != project_id:
        raise HTTPException(status_code=400, detail="Este endpoint es solo para Botón Rojo")
    result = await db.execute(
        select(Contact).where(
            Contact.id == member_id,
            Contact.project_id == project.id,
            Contact.group_name == RED_GROUP,
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    phone = contact.phone
    await db.delete(contact)
    await db.flush()
    cfg = await _get_or_create_settings(db, project.id)
    remaining = await _list_group_members(db, project.id, RED_GROUP)
    cfg.persona_a_phone = remaining[0].phone if remaining else ""
    cfg.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await add_log(
        db,
        level="info",
        source="boton-rojo",
        message="Miembro eliminado de Red Comunitaria",
        detail=phone,
    )


@router.get("/api/projects/{project_id}/boton-rojo/equipo", response_model=list[EquipoMemberOut])
async def list_equipo(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = await _get_boton_project(db)
    if project.id != project_id:
        raise HTTPException(status_code=400, detail="Este endpoint es solo para Botón Rojo")
    result = await db.execute(
        select(Contact)
        .where(Contact.project_id == project.id, Contact.group_name == EQUIPO_GROUP)
        .order_by(Contact.id.desc())
    )
    return result.scalars().all()


@router.post(
    "/api/projects/{project_id}/boton-rojo/equipo",
    response_model=EquipoMemberOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_equipo_member(
    project_id: int,
    payload: EquipoMemberIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = await _get_boton_project(db)
    if project.id != project_id:
        raise HTTPException(status_code=400, detail="Este endpoint es solo para Botón Rojo")
    contact = Contact(
        project_id=project.id,
        name=payload.name.strip(),
        phone=normalize_phone_ar(payload.phone),
        group_name=EQUIPO_GROUP,
        institution=(payload.institution or "").strip() or None,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    await add_log(
        db,
        level="info",
        source="boton-rojo",
        message=f"Miembro agregado al Equipo de alerta: {contact.name}",
        detail=f"{contact.phone} · {contact.institution or '-'}",
    )
    return contact


@router.delete("/api/projects/{project_id}/boton-rojo/equipo/{member_id}", status_code=204)
async def delete_equipo_member(
    project_id: int,
    member_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = await _get_boton_project(db)
    if project.id != project_id:
        raise HTTPException(status_code=400, detail="Este endpoint es solo para Botón Rojo")
    result = await db.execute(
        select(Contact).where(
            Contact.id == member_id,
            Contact.project_id == project.id,
            Contact.group_name == EQUIPO_GROUP,
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    await db.delete(contact)
    await db.commit()


@router.get(
    "/api/projects/{project_id}/boton-rojo/antecedentes",
    response_model=list[AntecedenteOut],
)
async def list_antecedentes(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Historial de alertas recibidas + SMS intentados (útil si falla la entrega)."""
    project = await _get_boton_project(db)
    if project.id != project_id:
        raise HTTPException(status_code=400, detail="Este endpoint es solo para Botón Rojo")

    alerts = (
        await db.execute(
            select(BotonRojoAlert)
            .where(BotonRojoAlert.project_id == project.id)
            .order_by(BotonRojoAlert.id.desc())
            .limit(100)
        )
    ).scalars().all()

    messages = (
        await db.execute(
            select(Message)
            .where(
                Message.project_id == project.id,
                Message.category.in_(["boton-rojo-persona-a", "boton-rojo-equipo"]),
            )
            .order_by(Message.id.desc())
            .limit(500)
        )
    ).scalars().all()

    contacts = (
        await db.execute(select(Contact).where(Contact.project_id == project.id))
    ).scalars().all()
    contact_by_phone = {c.phone: c for c in contacts}

    items: list[AntecedenteOut] = []
    for alert in alerts:
        related: list[Message] = []
        for msg in messages:
            if msg.category == "boton-rojo-persona-a" and alert.token in (msg.content or ""):
                related.append(msg)
            elif (
                msg.category == "boton-rojo-equipo"
                and alert.requester_phone in (msg.content or "")
                and msg.created_at
                and alert.created_at
                and msg.created_at >= alert.created_at
            ):
                # Evitar mezclar con alertas posteriores del mismo teléfono
                related.append(msg)

        # Quitar mensajes de equipo que ya pertenecen a una alerta más nueva del mismo requester
        newer_same_phone = [
            a
            for a in alerts
            if a.id > alert.id and a.requester_phone == alert.requester_phone and a.created_at
        ]
        if newer_same_phone:
            cutoff = min(a.created_at for a in newer_same_phone if a.created_at)
            related = [
                m
                for m in related
                if m.category != "boton-rojo-equipo"
                or not m.created_at
                or m.created_at < cutoff
            ]

        related.sort(key=lambda m: m.id)
        equipo_msgs = [m for m in related if m.category == "boton-rojo-equipo"]
        equipo_ok = sum(1 for m in equipo_msgs if m.status != "failed")
        equipo_fail = sum(1 for m in equipo_msgs if m.status == "failed")
        equipo_enviado = alert.status == "team_alerted" or bool(equipo_msgs)
        items.append(
            AntecedenteOut(
                id=alert.id,
                requester_phone=alert.requester_phone,
                requester_name=alert.requester_name,
                status=alert.status,
                created_at=alert.created_at,
                notified_at=alert.notified_at,
                team_alerted_at=alert.team_alerted_at,
                persona_a_enviada=bool(alert.notified_at)
                or any(m.category == "boton-rojo-persona-a" for m in related),
                equipo_enviado=equipo_enviado,
                equipo_sms_enviados=equipo_ok,
                equipo_sms_fallidos=equipo_fail,
                messages=[
                    AntecedenteMessageOut(
                        id=m.id,
                        to_phone=m.to_phone,
                        to_name=(
                            contact_by_phone[m.to_phone].name
                            if m.to_phone in contact_by_phone
                            else ("Red Comunitaria" if m.category == "boton-rojo-persona-a" else None)
                        ),
                        to_institution=(
                            contact_by_phone[m.to_phone].institution
                            if m.to_phone in contact_by_phone
                            else None
                        ),
                        content=m.content,
                        status=m.status,
                        category=m.category,
                        error_detail=m.error_detail,
                        created_at=m.created_at,
                        sent_at=m.sent_at,
                    )
                    for m in related
                ],
            )
        )
    return items


@router.post("/api/public/boton-rojo/alerta", response_model=PublicAlertaOut)
async def public_recibir_formulario(
    payload: PublicAlertaIn,
    db: AsyncSession = Depends(get_db),
):
    """Lo llama el otro proyecto cuando alguien completa el formulario."""
    project = await _get_boton_project(db)
    red_members = await _ensure_red_members(db, project)
    if not red_members:
        await add_log(
            db,
            level="error",
            source="boton-rojo",
            message="Formulario recibido pero falta Celular Red Comunitaria",
            detail=payload.phone,
        )
        raise HTTPException(
            status_code=400,
            detail="Falta configurar Red Comunitaria en Botón Rojo (al menos un celular)",
        )

    requester = normalize_phone_ar(payload.phone)
    token = secrets.token_urlsafe(24)
    alert = BotonRojoAlert(
        project_id=project.id,
        token=token,
        requester_phone=requester,
        requester_name=(payload.name or "").strip() or None,
        status="pending",
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    link = f"{settings.public_link_base}/boton-rojo/avisar/{token}"
    who = alert.requester_name or requester
    content = (
        f"Se activo el Boton Rojo. Una persona solicita ayuda ({who}, cel {requester}). "
        f"Avisar equipo: {link}"
    )

    sent = 0
    failed = 0
    phones: list[str] = []
    for member in red_members:
        message = Message(
            project_id=project.id,
            to_phone=member.phone,
            content=content,
            category="boton-rojo-persona-a",
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        message = await dispatch_message(db, message)
        phones.append(member.phone)
        if message.status == "failed":
            failed += 1
        else:
            sent += 1

    alert.status = "persona_a_notified"
    alert.notified_at = datetime.now(timezone.utc)
    await db.commit()

    await add_log(
        db,
        level="info" if sent > 0 else "error",
        source="boton-rojo",
        message="Formulario recibido: aviso enviado a Red Comunitaria",
        detail=(
            f"requester={requester} red_comunitaria={','.join(phones)} "
            f"sent={sent} failed={failed} link={link}"
        ),
    )

    if sent == 0:
        return PublicAlertaOut(
            ok=False,
            detail=f"No se pudo avisar a Red Comunitaria (fallidos: {failed})",
            alert_id=alert.id,
        )
    return PublicAlertaOut(
        ok=True,
        detail=f"Aviso enviado a Red Comunitaria ({sent} SMS) con link para avisar al equipo",
        alert_id=alert.id,
    )


@router.post("/api/public/boton-rojo/avisar/{token}")
async def public_avisar_equipo(token: str, db: AsyncSession = Depends(get_db)):
    """Red Comunitaria abre el link del SMS y se dispara el aviso al Equipo de alerta."""
    project = await _get_boton_project(db)
    result = await db.execute(select(BotonRojoAlert).where(BotonRojoAlert.token == token))
    alert = result.scalar_one_or_none()
    if not alert or alert.project_id != project.id:
        raise HTTPException(status_code=404, detail="Link inválido o expirado")

    if alert.status == "team_alerted":
        return {
            "ok": True,
            "already_done": True,
            "detail": "El equipo ya fue avisado con este link",
            "sent": 0,
        }

    members = (
        await db.execute(
            select(Contact).where(
                Contact.project_id == project.id,
                Contact.group_name == EQUIPO_GROUP,
            )
        )
    ).scalars().all()
    if not members:
        await add_log(
            db,
            level="warning",
            source="boton-rojo",
            message="Link Avisar equipo abierto pero Equipo de alerta está vacío",
            detail=alert.requester_phone,
        )
        raise HTTPException(status_code=400, detail="Equipo de alerta vacío. Agregá celulares en el admin.")

    who = alert.requester_name or alert.requester_phone
    content = (
        f"ALERTA Boton Rojo: {who} (cel {alert.requester_phone}) solicita ayuda. "
        f"Activado por Red Comunitaria."
    )

    sent = 0
    failed = 0
    for member in members:
        message = Message(
            project_id=project.id,
            to_phone=member.phone,
            content=content,
            category="boton-rojo-equipo",
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        message = await dispatch_message(db, message)
        if message.status == "failed":
            failed += 1
        else:
            sent += 1

    alert.status = "team_alerted"
    alert.team_alerted_at = datetime.now(timezone.utc)
    await db.commit()

    await add_log(
        db,
        level="info" if sent else "error",
        source="boton-rojo",
        message="Equipo de alerta avisado",
        detail=f"requester={alert.requester_phone} sent={sent} failed={failed}",
    )
    return {
        "ok": sent > 0,
        "already_done": False,
        "detail": f"Avisos enviados: {sent}. Fallidos: {failed}.",
        "sent": sent,
        "failed": failed,
    }


@router.get("/api/public/boton-rojo/avisar/{token}")
async def public_avisar_equipo_info(token: str, db: AsyncSession = Depends(get_db)):
    project = await _get_boton_project(db)
    result = await db.execute(select(BotonRojoAlert).where(BotonRojoAlert.token == token))
    alert = result.scalar_one_or_none()
    if not alert or alert.project_id != project.id:
        raise HTTPException(status_code=404, detail="Link inválido o expirado")
    return {
        "ok": True,
        "status": alert.status,
        "requester_phone": alert.requester_phone,
        "requester_name": alert.requester_name,
        "already_done": alert.status == "team_alerted",
    }
