"""Application entry point.
Creates the FastAPI app, includes routers, configures CORS, and ensures DB tables exist.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app import models  # Ensures model classes are registered on Base.metadata
from app.routers import auth, users, lookup, messages


def run_migrations() -> None:
    """Idempotent schema migrations for columns added after initial table creation.

    Uses IF NOT EXISTS guards so this is safe to run on every startup.
    Required because create_all() only creates missing *tables*, not missing *columns*.
    """
    migrations = [
        # Presence / DND toggle — added in v2
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_dnd BOOLEAN NOT NULL DEFAULT FALSE;",
        # Last-activity timestamp for online presence — added in v2
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;",
    ]
    with engine.begin() as conn:
        for stmt in migrations:
            conn.execute(text(stmt))


app = FastAPI(title="Iskomeet API", version="1.0.0")

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://192.168.100.13:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Apply column migrations, then ensure all tables exist
run_migrations()
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(lookup.router, prefix="/lookup", tags=["lookup"])
app.include_router(messages.router, prefix="/messages", tags=["messages"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}