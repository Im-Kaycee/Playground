import time
import httpx
from fastapi import APIRouter, HTTPException, Depends
from App.auth.auth import get_current_user
from App.models.models import *
from App.schemas.proxy import *
from sqlmodel import Session
from App.models.db import get_session
from App.models.models import ProxyLog

router = APIRouter(prefix="/api", tags=["proxy"])
def generate_name(method: str, url: str) -> str:
    try:
        path = url.split("://", 1)[1].split("/", 1)[1]
        path = "/" + path
    except IndexError:
        path = "/"

    return f"{method} {path}"

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
from App.schemas.logs import LogEntry
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


@router.post("/proxy/saved",response_model=SavedRequestCreate)
async def save_request(
    payload: SavedRequestCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    name = payload.name or generate_name(payload.method, str(payload.url))
    saved_request = SavedRequest(
        user_id=current_user.id,
        name=name,
        method=payload.method,
        url=str(payload.url),
        headers=payload.headers,
        body=payload.body
    )
    session.add(saved_request)
    session.commit()
    session.refresh(saved_request)
    return saved_request
@router.get("/proxy/saved", response_model=list[SavedRequestRead])
async def get_saved_requests(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = (
        select(SavedRequest)
        .where(SavedRequest.user_id == current_user.id)
        .order_by(SavedRequest.created_at.desc())
    )

    return session.exec(statement).all()
@router.delete("/proxy/saved/{request_id}")
async def delete_saved_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    saved_request = session.get(SavedRequest, request_id)

    if not saved_request or saved_request.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Saved request not found")

    session.delete(saved_request)
    session.commit()

    return {"detail": "Saved request deleted"}
@router.get("/proxy/saved/{request_id}", response_model=SavedRequestRead)
async def get_saved_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    saved_request = session.get(SavedRequest, request_id)

    if not saved_request or saved_request.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Saved request not found")

    return saved_request

