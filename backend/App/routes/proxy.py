import time
import httpx
from fastapi import APIRouter, HTTPException
from schemas.proxy import *

router = APIRouter(prefix="/api", tags=["proxy"])

@router.post("/proxy", response_model=ProxyResponse)
async def proxy_request(payload: ProxyRequest):
    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.request(
                method=payload.method,
                url=str(payload.url),
                headers=payload.headers,
                json=payload.body if payload.method != "GET" else None
            )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream request timed out")

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Request failed: {str(e)}"
        )

    elapsed_ms = int((time.time() - start_time) * 1000)

    # Try to parse JSON response, fall back to text
    try:
        response_body = response.json()
    except ValueError:
        response_body = response.text

    return ProxyResponse(
        status=response.status_code,
        headers=dict(response.headers),
        body=response_body,
        response_time=elapsed_ms
    )
