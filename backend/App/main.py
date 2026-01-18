from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.proxy import router as proxy_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proxy_router)


@app.get("/health")
def health():
    return {"status": "ok"}
