import asyncio
import httpx
from fastapi import APIRouter, Depends
from models.models import *
from auth.auth import get_current_user
from schemas.rate_limit import RateLimitTestRequest, RateLimitTestResult

router = APIRouter(prefix="/api", tags=["rate-limit"])
async def send_request(client, payload):
    try:
        res = await client.request(
            method=payload.method,
            url=str(payload.url),
            headers=payload.headers,
            json=payload.body if payload.method != "GET" else None,
            timeout=10
        )
        return res.status_code
    except Exception:
        return None
@router.post("/rate-limit-test", response_model=RateLimitTestResult)
async def rate_limit_test(
    payload: RateLimitTestRequest,
    current_user: User = Depends(get_current_user),
):
    total = 0
    success = 0
    rate_limited = 0
    errors = 0

    first_429_request = None
    first_429_second = None

    async with httpx.AsyncClient() as client:
        for second in range(payload.duration):
            tasks = [
                send_request(client, payload)
                for _ in range(payload.rps)
            ]

            results = await asyncio.gather(*tasks)

            for status in results:
                total += 1

                if status == 429:
                    rate_limited += 1
                    if first_429_request is None:
                        first_429_request = total
                        first_429_second = second + 1
                elif status and status < 400:
                    success += 1
                else:
                    errors += 1

            # pacing: ensure per-second execution
            await asyncio.sleep(1)

    max_safe_rps = None
    if first_429_request and first_429_second:
        successful_requests_before_429 = first_429_request - 1
        max_safe_rps = successful_requests_before_429 // first_429_second

    return RateLimitTestResult(
        total_requests=total,
        successful_requests=success,
        rate_limited_requests=rate_limited,
        other_errors=errors,
        first_429_at_request=first_429_request,
        first_429_at_second=first_429_second,
        max_safe_rps_estimate=max_safe_rps,
    )

