# schemas/logs.py
from pydantic import BaseModel, HttpUrl
from datetime import datetime

class LogEntry(BaseModel):
    id: int
    user_id: int
    method: str
    url: HttpUrl
    status_code: int | None
    response_time_ms: int
    timestamp: datetime

    class Config:
        from_attributes = True
