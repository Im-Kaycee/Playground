from typing import Dict, Optional, Any
from pydantic import BaseModel, HttpUrl, field_validator
from datetime import datetime
#First Schemas
class ProxyRequest(BaseModel):
    method: str
    url: HttpUrl
    headers: Optional[Dict[str, str]] = {}
    body: Optional[Any] = None

    @field_validator("method")
    def validate_method(cls, v):
        allowed = {"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}
        v = v.upper()
        if v not in allowed:
            raise ValueError("Invalid HTTP method")
        return v


class ProxyResponse(BaseModel):
    status: int
    headers: Dict[str, str]
    body: Any
    response_time: int  # milliseconds

class SavedRequestCreate(BaseModel):
    name: str | None = None
    method: str
    url: HttpUrl
    headers: Optional[Dict[str, str]] = {}
    body: Optional[Any] = None

    @field_validator("method")
    def validate_method(cls, v):
        allowed = {"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}
        v = v.upper()
        if v not in allowed:
            raise ValueError("Invalid HTTP method")
        return v
class SavedRequestRead(SavedRequestCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
