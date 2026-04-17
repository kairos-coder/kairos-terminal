from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

# Supabase (optional but supported)
try:
    from supabase import create_client, Client
except Exception:
    create_client = None
    Client = None


# -----------------------------
# CONFIG
# -----------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = None
if create_client and SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# -----------------------------
# APP INIT
# -----------------------------
app = FastAPI(title="Kairos Terminal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# REQUEST MODEL
# -----------------------------
class Command(BaseModel):
    raw: str


# -----------------------------
# SIMPLE COMMAND PARSER
# -----------------------------
def parse_command(raw: str):
    parts = raw.strip().split()
    if not parts:
        return {"cmd": None, "args": []}

    return {
        "cmd": parts[0].lower(),
        "args": parts[1:]
    }


# -----------------------------
# CORE EXECUTION ENGINE
# -----------------------------
@app.post("/execute")
def execute(cmd: Command):

    parsed = parse_command(cmd.raw)
    command = parsed["cmd"]
    args = parsed["args"]

    # -------------------------
    # PING
    # -------------------------
    if command == "ping":
        return {
            "status": "ok",
            "response": "kairos online"
        }

    # -------------------------
    # WRITE (to Supabase if available)
    # -------------------------
    if command == "write":
        if len(args) < 2:
            return {
                "status": "error",
                "message": "Usage: write <type> <content>"
            }

        entry_type = args[0]
        content = " ".join(args[1:])

        data = {
            "type": entry_type,
            "content": content
        }

        if supabase:
            result = supabase.table("entries").insert(data).execute()
            return {
                "status": "ok",
                "action": "write",
                "stored": True,
                "data": result.data
            }

        # fallback if Supabase not configured
        return {
            "status": "ok",
            "action": "write",
            "stored": False,
            "warning": "Supabase not configured",
            "data": data
        }

    # -------------------------
    # FIND (query by type)
    # -------------------------
    if command == "find":