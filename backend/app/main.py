import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.routes import health
from app.routes import ingest
from app.routes import retrieve
from app.routes import query
from app.routes import documents

logger = logging.getLogger("hybridrag")

app = FastAPI(
    title="HybridRAG API",
    version="0.1.0",
    description="Hybrid Dense + Sparse Retrieval-Augmented Generation",
)


class ErrorEnvelopeMiddleware(BaseHTTPMiddleware):
    """Turn unhandled exceptions into a JSON error response.

    Starlette's own 500 handler sits above the CORS layer, so an unhandled
    exception produces a response with no Access-Control-Allow-Origin header
    and the browser reports it as a CORS failure rather than a server error.
    Catching here, inside CORSMiddleware, keeps the headers on error responses
    so the frontend can tell a failing backend apart from an unreachable one.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception:
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(
                status_code=500,
                content={
                    "error": "The service hit an unexpected error.",
                    "code": "internal_error",
                },
            )


# Registration order matters: the middleware added last is the outermost, so
# CORS must be added after the error handler in order to wrap it.
app.add_middleware(ErrorEnvelopeMiddleware)
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
app.include_router(query.router)
app.include_router(documents.router)
