import os
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse

from router.models.model import AdminLogin, AdminRegister
from auth.jwt_utils import create_access_token
from auth.settings import ACCESS_TOKEN_EXPIRE_HOURS

from log.log import setup_logger

from db.models.auth import register_admin, login_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)
logger = setup_logger("Router/auth")

@router.get("/auth", response_class=HTMLResponse)
async def get_catalog(request: Request):
    return templates.TemplateResponse("auth.html", {"request": request})

@router.post("/register")
async def admin_register(data: AdminRegister):
    try:
        await register_admin(data.login, data.password)
        return {"status": "ok"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Ошибка сервера")

@router.post("/login")
async def admin_login_endpoint(data: AdminLogin):
    try:
        await login_admin(data.login, data.password, data.ip)
        token = create_access_token(data.login)
        response = JSONResponse(content={"status": "ok"})
        # Отправляем токен в cookie на 24 часа
        response.set_cookie(
            key="admin_token",
            value=token,
            httponly=True,
            max_age=ACCESS_TOKEN_EXPIRE_HOURS * 3600
        )
        return response
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Ошибка сервера")

@router.post("/logout")
async def admin_logout(response: Response):
    """
    Выход администратора: сброс cookie с токеном
    """
    # Сбрасываем токен (cookie становится пустой, max_age=0)
    response.delete_cookie(key="admin_token")
    return {"status": "ok"}