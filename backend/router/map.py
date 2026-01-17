import os
import json
from fastapi import Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.encoders import jsonable_encoder
from fastapi import APIRouter, Request
from auth.telegram_auth import get_verified_user
from router.models.model import SaveDataRequest, SaveResponse
from datetime import datetime
from log.log import setup_logger

router = APIRouter(
    prefix="",
    tags=["Map"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)
logger = setup_logger("Router/map")

@router.get("/map", response_class=HTMLResponse)
async def get_catalog(request: Request):
    return templates.TemplateResponse("map.html", {"request": request})