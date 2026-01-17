import asyncio
import os
import json
from fastapi import Depends, HTTPException, Response
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.encoders import jsonable_encoder
from fastapi import APIRouter, Request
from auth.telegram_auth import get_verified_user
from qr_code.qr_code import generate_qr_sync
from router.models.model import SaveDataRequest, SaveResponse, UserId
from datetime import datetime
from log.log import setup_logger

router = APIRouter(
    prefix="",
    tags=["QR-Code"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)
logger = setup_logger("Router/catalog")

@router.post("/api/client/club-qr", response_class=HTMLResponse)
async def post_qrcode_client(request: UserId):
    loop = asyncio.get_running_loop()
    png_bytes = await loop.run_in_executor(
        None,
        generate_qr_sync,
        request.user_id,
        22,
        "Алексей"
    )

    return Response(content=png_bytes, media_type="image/png")