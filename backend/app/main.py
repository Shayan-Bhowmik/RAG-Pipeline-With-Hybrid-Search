from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health
from app.routes import ingest
from app.routes import retrieve

app = FastAPI(
    title="HybridRAG API",
    version="0.1.0",
    description="Hybrid Dense + Sparse Retrieval-Augmented Generation",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ingest.router)
app.include_router(retrieve.router)
