from zoneinfo import ZoneInfo
from db.database import DataBase
from log.log import setup_logger

Database = DataBase()
MOSCOW_TZ = ZoneInfo("Europe/Moscow")
logger = setup_logger("Database/user")

async def add_and_check_userdata(userdata: dict):
    user_id = userdata.id
    user_first_name = userdata.first_name
    user_last_name = userdata.last_name
    user_username = userdata.username
    user_photo_url = userdata.photo_url
    
    try:
        pool = await Database.connect()
        
        # Проверяем существование пользователя
        async with pool.acquire() as conn:
            user_exists = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM public.\"user\" WHERE user_id = $1)",
                user_id
            )
        
        if not user_exists:
            # Добавляем нового пользователя
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO public."user" 
                    (user_id, tg_name, first_name, last_name, photo_url) 
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    user_id,
                    user_username,
                    user_first_name,
                    user_last_name,
                    user_photo_url
                )
            logger.info(f"Пользователь {user_id} добавлен в БД")
            
        else:
            # Обновляем существующего пользователя
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE public."user" 
                    SET tg_name = $1, first_name = $2, 
                        last_name = $3, photo_url = $4
                    WHERE user_id = $5
                    """,
                    user_username,
                    user_first_name,
                    user_last_name,
                    user_photo_url,
                    user_id
                )
            logger.info(f"Данные пользователя {user_id} обновлены в БД")
            
    except Exception as error:
        logger.error(f"Ошибка работы с пользователем {user_id}: {error}")
        raise