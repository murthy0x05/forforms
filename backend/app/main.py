from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.views import form_router, question_router, public_router, response_router
from app.seed import seed_database

app = FastAPI(
    title="ForForms API",
    description="A Typeform clone backend — build and share beautiful forms",
    version="1.0.0",
)

import os

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(form_router)
app.include_router(question_router)
app.include_router(public_router)
app.include_router(response_router)


@app.on_event("startup")
def startup():
    """Initialize database and seed sample data on startup."""
    init_db()
    seed_database()


@app.get("/")
def root():
    """Health check endpoint."""
    return {"message": "ForForms API is running", "version": "1.0.0"}


@app.get("/api/health")
def health():
    """Health check."""
    return {"status": "healthy"}
