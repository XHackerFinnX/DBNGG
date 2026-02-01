import os
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import APIRouter, HTTPException, Request
from log.log import setup_logger

from auth.jwt_utils import decode_access_token

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)
logger = setup_logger("Router/admin")

@router.get("/validate-token")
async def validate_token(request: Request):
    token = request.cookies.get("admin_token")
    admin_login = decode_access_token(token)
    if not admin_login:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"status": "ok", "login": admin_login}

@router.get("/panel", response_class=HTMLResponse)
async def get_catalog(request: Request):
    token = request.cookies.get("admin_token")
    admin_login = decode_access_token(token)
    if not admin_login:
        # Не авторизован → редирект на страницу логина
        return RedirectResponse(url="/admin/auth")
    return templates.TemplateResponse("admin.html", {"request": request})