from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text

from app.auth import hash_password
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import (
    BotonRojoSettings,
    Contact,
    Device,
    GatewaySettings,
    Message,
    Project,
    SystemLog,
    User,
)
from app.routers import admin, auth, boton_rojo, contacts, devices, gateway, logs, messages, projects


async def ensure_sqlite_columns() -> None:
    """Agrega columnas nuevas a tablas ya existentes (SQLite)."""
    if not settings.database_url.startswith("sqlite"):
        return
    alters = [
        ("devices", "project_id INTEGER"),
        ("contacts", "project_id INTEGER"),
        ("contacts", "institution VARCHAR(120)"),
        ("messages", "project_id INTEGER"),
        ("gateway_settings", "project_id INTEGER"),
        ("system_logs", "project_id INTEGER"),
        ("boton_rojo_alerts", "public_id VARCHAR(16)"),
        ("boton_rojo_alerts", "form_data TEXT"),
    ]
    async with engine.begin() as conn:
        for table, coldef in alters:
            try:
                await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {coldef}"))
            except Exception:  # noqa: BLE001 - columna ya existe
                pass


async def ensure_postgres_columns() -> None:
    """Agrega columnas nuevas en Postgres (producción VPS)."""
    if not settings.database_url.startswith("postgresql"):
        return
    alters = [
        "ALTER TABLE boton_rojo_alerts ADD COLUMN IF NOT EXISTS public_id VARCHAR(16)",
        "ALTER TABLE boton_rojo_alerts ADD COLUMN IF NOT EXISTS form_data TEXT",
    ]
    async with engine.begin() as conn:
        for stmt in alters:
            await conn.execute(text(stmt))


async def seed_data() -> None:
    async with SessionLocal() as db:
        result = await db.execute(select(User).where(User.email == settings.admin_email))
        user = result.scalar_one_or_none()
        if not user:
            db.add(
                User(
                    email=settings.admin_email,
                    hashed_password=hash_password(settings.admin_password),
                    full_name="Demo Mensajes ARG",
                )
            )
        else:
            user.hashed_password = hash_password(settings.admin_password)
            user.full_name = "Demo Mensajes ARG"
            user.is_active = True

        # Operador dedicado: entra directo a Botón Rojo
        # Login: botonrojo@mensajesarg.com / botonrojoadmin (también acepta "botonrojo")
        br_emails = ("botonrojo@mensajesarg.com", "botonrojo")
        br_user = None
        for br_email in br_emails:
            br_user = (
                await db.execute(select(User).where(User.email == br_email))
            ).scalar_one_or_none()
            if br_user:
                break
        if not br_user:
            db.add(
                User(
                    email="botonrojo@mensajesarg.com",
                    hashed_password=hash_password("botonrojoadmin"),
                    full_name="Botón Rojo Admin",
                )
            )
        else:
            br_user.email = "botonrojo@mensajesarg.com"
            br_user.hashed_password = hash_password("botonrojoadmin")
            br_user.full_name = "Botón Rojo Admin"
            br_user.is_active = True

        demo = (await db.execute(select(Project).where(Project.slug == "demo"))).scalar_one_or_none()
        if not demo:
            demo = Project(
                slug="demo",
                name="DEMO",
                description="Proyecto de prueba para conectar celular, enviar SMS y ver logs",
                color="#19c98a",
            )
            db.add(demo)
            await db.flush()

        boton_rojo = (
            await db.execute(select(Project).where(Project.slug == "boton-rojo"))
        ).scalar_one_or_none()
        if not boton_rojo:
            boton_rojo = Project(
                slug="boton-rojo",
                name="Botón Rojo",
                description=(
                    "Recibe formulario del otro proyecto → SMS a Red Comunitaria → "
                    "link Avisar equipo → SMS a Equipo de alerta"
                ),
                color="#e85d4c",
            )
            db.add(boton_rojo)
            await db.flush()
        else:
            boton_rojo.name = "Botón Rojo"
            boton_rojo.color = "#e85d4c"
            boton_rojo.description = (
                "Recibe formulario del otro proyecto → SMS a Red Comunitaria → "
                "link Avisar equipo → SMS a Equipo de alerta"
            )

        # Conservar Equipo de alerta y Red Comunitaria; borrar otros contactos de prueba
        old_br_contacts = (
            await db.execute(select(Contact).where(Contact.project_id == boton_rojo.id))
        ).scalars().all()
        for contact in old_br_contacts:
            if contact.group_name not in {"Equipo de alerta", "Red Comunitaria"}:
                await db.delete(contact)

        br_settings = (
            await db.execute(
                select(BotonRojoSettings).where(BotonRojoSettings.project_id == boton_rojo.id)
            )
        ).scalar_one_or_none()
        if not br_settings:
            db.add(
                BotonRojoSettings(
                    project_id=boton_rojo.id,
                    persona_a_phone="",
                )
            )

        devices = (await db.execute(select(Device))).scalars().all()
        if not devices:
            db.add_all(
                [
                    Device(
                        project_id=demo.id,
                        name="Android Gateway Principal",
                        phone_number="+5491112345678",
                        is_online=False,
                        notes="Ejemplo seed (desactivado)",
                    ),
                ]
            )
        else:
            for device in devices:
                if device.project_id is None:
                    device.project_id = demo.id

        contacts = (await db.execute(select(Contact))).scalars().all()
        if not contacts:
            db.add_all(
                [
                    Contact(
                        project_id=demo.id,
                        name="Vecino Centro",
                        phone="+5491100000001",
                        group_name="Barrio Centro",
                    ),
                    Contact(
                        project_id=demo.id,
                        name="Cliente Panadería",
                        phone="+5491100000002",
                        group_name="Comercios",
                    ),
                ]
            )
        else:
            for contact in contacts:
                if contact.project_id is None:
                    contact.project_id = demo.id

        for row in (await db.execute(select(Message))).scalars().all():
            if row.project_id is None:
                row.project_id = demo.id
        for row in (await db.execute(select(SystemLog))).scalars().all():
            if row.project_id is None:
                row.project_id = demo.id
        for row in (await db.execute(select(GatewaySettings))).scalars().all():
            if row.project_id is None:
                row.project_id = demo.id

        await db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await ensure_sqlite_columns()
    await ensure_postgres_columns()
    await seed_data()
    yield


app = FastAPI(
    title="Mensajes ARG API",
    description="Plataforma de automatización de envío de mensajes vía httpSMS",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(devices.router)
app.include_router(messages.router)
app.include_router(contacts.router)
app.include_router(admin.router)
app.include_router(gateway.router)
app.include_router(logs.router)
app.include_router(boton_rojo.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "product": "Mensajes ARG"}
