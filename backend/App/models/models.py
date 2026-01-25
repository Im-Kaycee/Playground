from sqlmodel import SQLModel, Field, create_engine, Session, Relationship
from typing import Optional, List
import datetime  
from datetime import timezone, datetime 
import os
from sqlalchemy import Column
from sqlalchemy.dialects.sqlite import JSON

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./App/database.db")

def get_utc_now():
    return datetime.now(timezone.utc)

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=get_utc_now)

    proxy_logs: List["ProxyLog"] = Relationship(back_populates="user")


class ProxyLog(SQLModel, table=True):
    __tablename__ = "proxy_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    method: str
    url: str
    status_code: Optional[int] = None
    response_time_ms: int
    timestamp: datetime = Field(default_factory=get_utc_now, index=True)

    user: Optional[User] = Relationship(back_populates="proxy_logs")


class SavedRequest(SQLModel, table=True):
    __tablename__ = "saved_requests"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    name: str
    method: str
    url: str
    headers: dict = Field(sa_column=Column(JSON))
    body: dict | None = Field(default=None, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=get_utc_now)
