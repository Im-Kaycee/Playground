from pydantic import BaseModel, HttpUrl, field_validator
from typing import Dict, Optional, Any
from typing_extensions import Literal

class RateLimitTestRequest(BaseModel):
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"]
    url: HttpUrl
    headers: Dict[str, str] = {}
    body: Optional[Any] = None

    rps: int           # requests per second
    duration: int      # seconds

    @field_validator("rps")
    def validate_rps(cls, v):
        if v <= 0 or v > 1000:
            raise ValueError("rps must be between 1 and 1000")
        return v

    @field_validator("duration")
    def validate_duration(cls, v):
        if v <= 0 or v > 60:
            raise ValueError("duration must be between 1 and 60 seconds")
        return v
class RateLimitTestResult(BaseModel):
    total_requests: int
    successful_requests: int
    rate_limited_requests: int
    other_errors: int

    first_429_at_request: Optional[int]
    first_429_at_second: Optional[int]

    max_safe_rps_estimate: Optional[int]
