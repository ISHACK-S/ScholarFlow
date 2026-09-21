import sys
from pathlib import Path
import traceback

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config.settings import SUPABASE_URL, SUPABASE_ANON_KEY
from app.config.startup_validation import validate_runtime_configuration
from app.database.supabase_client import get_supabase_auth_client
from app.routes.notes_routes import router as notes_router

load_dotenv()
validate_runtime_configuration()

app = FastAPI(title="ScholarFlow AI API")
print("===== BACKEND STARTED =====")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes_router)


@app.get("/health")
def health_check():
    return {"message": "ScholarFlow AI backend is running"}


@app.post("/auth/login")
def login(payload: dict):
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured."
        )

    client = get_supabase_auth_client()

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase client could not be created."
        )

    try:
        response = client.auth.sign_in_with_password(
            {
                "email": payload.get("email", ""),
                "password": payload.get("password", ""),
            }
        )

        session = response.session

        if session is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        return {
            "access_token": session.access_token,
            "token_type": "bearer",
            "message": "Login successful",
        }

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=401,
            detail=str(exc)
        )


@app.post("/auth/signup")
def signup(payload: dict):
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured."
        )

    client = get_supabase_auth_client()

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase client could not be created."
        )

    try:
        response = client.auth.sign_up(
            {
                "email": payload.get("email", ""),
                "password": payload.get("password", ""),
                "options": {
                    "data": {
                        "full_name": payload.get("full_name", "")
                    }
                },
            }
        )

        return {
            "message": "Account created successfully",
            "user": response.user.email if response.user else None,
        }

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )