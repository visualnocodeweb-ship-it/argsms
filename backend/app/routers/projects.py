from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Project, User

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectOut(BaseModel):
    id: int
    slug: str
    name: str
    description: str | None
    color: str
    is_active: bool

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=64)
    description: str | None = None
    color: str = "#19c98a"


@router.get("", response_model=list[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.is_active.is_(True)).order_by(Project.id.asc()))
    return result.scalars().all()


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return project


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    slug = payload.slug.strip().lower().replace(" ", "-")
    existing = await db.execute(select(Project).where(Project.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya existe un proyecto con ese slug")
    project = Project(
        name=payload.name.strip(),
        slug=slug,
        description=payload.description,
        color=payload.color,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project
