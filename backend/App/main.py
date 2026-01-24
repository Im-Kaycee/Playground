from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from routes.proxy import router as proxy_router
from routes.auth import router as auth_router
from routes.rate_limit import router as rate_limit_router
from routes.open_api import router as openapi_router 
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proxy_router)
app.include_router(auth_router)
app.include_router(rate_limit_router)
app.include_router(openapi_router)

@app.get("/health")
def health():
    return {"status": "ok"}
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/rate-test")
@limiter.limit("5/second")
def rate_test(request: Request):
    return {"ok": True}
