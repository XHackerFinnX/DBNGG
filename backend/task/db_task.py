from db.database import DataBase
from log.log import setup_logger

logger = setup_logger("Database-connect")

async def background_task_db():
    db = DataBase()
    try:
        await db.connect()
    except Exception as e:
        logger.error(f"Ошибка подключения к базе данных: {e}")
