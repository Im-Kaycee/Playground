import time
import httpx
from fastapi import APIRouter, HTTPException, Depends
from auth.auth import get_current_user
from models.models import User
from schemas.proxy import *
from sqlmodel import Session
from models.models import get_session
from models.models import ProxyLog

router = APIRouter(prefix="/api", tags=["proxy"])

@router.post("/proxy", response_model=ProxyResponse)
async def proxy_request(payload: ProxyRequest, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
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
    log = ProxyLog(
    user_id=current_user.id,
    method=payload.method,
    url=str(payload.url),
    status_code=response.status_code,
    response_time_ms=elapsed_ms
    )

    session.add(log)
    session.commit()


    return ProxyResponse(
        status=response.status_code,
        headers=dict(response.headers),
        body=response_body,
        response_time=elapsed_ms
    )

from sqlmodel import select
from schemas.logs import LogEntry
@router.get("/proxy/logs", response_model=list[LogEntry])
async def get_proxy_logs(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = (
        select(ProxyLog)
        .where(ProxyLog.user_id == current_user.id)
        .order_by(ProxyLog.timestamp.desc())
    )

    return session.exec(statement).all()
