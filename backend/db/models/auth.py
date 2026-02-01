from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import hashlib

from db.database import DataBase
from log.log import setup_logger
from passlib.context import CryptContext

Database = DataBase()
MOSCOW_TZ = ZoneInfo("Europe/Moscow")
logger = setup_logger("Database/admin")

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password: str) -> str:
    """
    SHA256 -> bcrypt
    Убирает лимит 72 байта и баги bcrypt
    """
    sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(sha)


def verify_password(password: str, hashed: str) -> bool:
    sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.verify(sha, hashed)

async def register_admin(login: str, password: str):
    try:
        pool = await Database.connect()
        hashed_password = hash_password(password)

        async with pool.acquire() as conn:
            exists = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM public.admin_user WHERE login = $1)",
                login
            )

        if exists:
            raise ValueError("Логин уже существует")

        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO public.admin_user (login, password, status)
                VALUES ($1, $2, 'admin')
                """,
                login,
                hashed_password
            )

        logger.info(f"Администратор {login} создан")

    except Exception as error:
        logger.error(f"Ошибка регистрации админа {login}: {error}")
        raise

async def login_admin(login: str, password: str, ip: str):
    try:
        pool = await Database.connect()

        async with pool.acquire() as conn:
            admin = await conn.fetchrow(
                """
                SELECT admin_id, password, status
                FROM public.admin_user
                WHERE login = $1
                """,
                login
            )

        if not admin:
            raise PermissionError("Неверный логин или пароль")

        if not verify_password(password, admin["password"]):
            raise PermissionError("Неверный логин или пароль")

        if admin["status"] != "admin":
            raise PermissionError("Нет прав доступа")

        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE public.admin_user
                SET ip_address_user = $1,
                    last_date = $2
                WHERE admin_id = $3
                """,
                ip,
                datetime.now(timezone.utc).replace(tzinfo=None),
                admin["admin_id"]
            )

        logger.info(f"Админ {login} вошёл с IP {ip}")

    except Exception as error:
        logger.error(f"Ошибка входа админа {login}: {error}")
        raise
