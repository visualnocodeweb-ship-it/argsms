from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.datetime_utils import UtcDateTime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool

    model_config = {"from_attributes": True}


class DeviceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone_number: str = Field(min_length=8, max_length=32)
    httpsms_id: Optional[str] = None
    notes: Optional[str] = None
    is_online: bool = False


class DeviceOut(BaseModel):
    id: int
    name: str
    phone_number: str
    httpsms_id: Optional[str]
    is_online: bool
    notes: Optional[str]
    created_at: UtcDateTime

    model_config = {"from_attributes": True}


class ContactCreate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    phone: str = Field(min_length=8, max_length=32)
    group_name: Optional[str] = None
    institution: Optional[str] = Field(default=None, max_length=120)


class ContactOut(BaseModel):
    id: int
    name: str
    phone: str
    group_name: Optional[str]
    institution: Optional[str] = None
    created_at: UtcDateTime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    to_phone: str = Field(min_length=8, max_length=32)
    content: str = Field(min_length=1, max_length=1600)
    category: Optional[str] = None
    device_id: Optional[int] = None


class BulkMessageCreate(BaseModel):
    phones: list[str] = Field(min_length=1)
    content: str = Field(min_length=1, max_length=1600)
    category: Optional[str] = None
    device_id: Optional[int] = None


class MessageOut(BaseModel):
    id: int
    to_phone: str
    content: str
    status: str
    category: Optional[str]
    device_id: Optional[int]
    external_id: Optional[str]
    error_detail: Optional[str]
    created_at: UtcDateTime
    sent_at: Optional[UtcDateTime]

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_messages: int
    sent: int
    pending: int
    failed: int
    devices_online: int
    devices_total: int
    contacts_total: int


class ProductInfo(BaseModel):
    name: str
    tagline: str
    description: str
    features: list[str]
    use_cases: list[dict]
