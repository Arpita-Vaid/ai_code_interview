from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ─── Auth Schemas ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── User Schemas ──────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
