import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from auth.telegram_auth import get_verified_user
from router.models.model import UserId
from db.models.user import add_and_check_userdata
from log.log import setup_logger

router = APIRouter(
    prefix="",
    tags=["Auth"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)
logger = setup_logger("Router/auth")

@router.post("/api/auth")
async def post_auth(request: UserId, user_data: dict = Depends(get_verified_user)):
    """
    Авторизация через Telegram WebApp.
    Проверяет подпись initData и сравнивает user_id из тела с верифицированным пользователем.
    """
    try:
        verified_user = user_data.user

        if not verified_user:
            logger.warning("401 - Invalid Telegram data")
            raise HTTPException(status_code=401, detail="Invalid Telegram data")

        if verified_user.id != request.user_id:
            logger.warning(f"{verified_user.id} != {request.user_id} / 401 - User ID mismatch")
            raise HTTPException(status_code=401, detail="User ID mismatch")

        await add_and_check_userdata(verified_user)
        logger.info(f"{verified_user.id} / Пользователь в БД")
        
        return JSONResponse({
            "status": "success",
            "message": "User verified successfully"
        })

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("Internal server error / Auth error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")
