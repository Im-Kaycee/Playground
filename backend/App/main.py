from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.proxy import router as proxy_router
from routes.auth import router as auth_router

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

@app.get("/health")
def health():
    return {"status": "ok"}
