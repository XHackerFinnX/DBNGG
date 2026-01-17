import asyncpg
from config import config
from log.log import setup_logger

logger = setup_logger("Database-connect")

class DataBase:
    def __init__(self):
        self._pool = None

    async def connect(self):
        """Подключаемся к базе данных с пулом соединений"""
        if not self._pool:
            try:
                logger.info("Попытка подключения к базе данных...")
                self._pool = await asyncpg.create_pool(
                    host=config.POSTGRESQL_HOST.get_secret_value(),
                    database=config.POSTGRESQL_DATABASE.get_secret_value(),
                    user=config.POSTGRESQL_USER.get_secret_value(),
                    password=config.POSTGRESQL_PASSWORD.get_secret_value(),
                    port=config.POSTGRESQL_PORT.get_secret_value(),
                    max_size=100,
                    min_size=20,
                    max_queries=200000,
                    timeout=20,
                    command_timeout=60
                )
                logger.info("Соединение с базой данных установлено и пул подключений создан.")
                
                await self.create_tables()
                
            except Exception as e:
                logger.error(f"Ошибка подключения к базе данных: {e}")
                self._pool = None
                raise
        
        return self._pool

    async def get_pool(self):
        """Получить пул соединений"""
        if not self._pool:
            await self.connect()
        return self._pool

    async def close(self):
        """Закрытие пула соединений"""
        if self._pool:
            await self._pool.close()
            self._pool = None
            logger.info("Пул соединений закрыт.")
        else:
            logger.warning("Пул подключений не был инициализирован.")

    async def create_tables(self):
        """Создание таблиц, если их нет"""
        if not self._pool:
            logger.error("Невозможно создать таблицы: пул подключений не инициализирован.")
            return
        
        try:
            async with self._pool.acquire() as connection:
                await connection.execute("""
                    CREATE TABLE IF NOT EXISTS public."user" (
                        user_id BIGINT PRIMARY KEY,
                        tg_name VARCHAR(255),
                        first_name VARCHAR(255),
                        last_name VARCHAR(255),
                        photo_url VARCHAR(255)
                    )
                """)
                logger.info("Таблицы базы данных созданы или уже существуют.")
        except Exception as e:
            logger.error(f"Ошибка при создании таблиц: {e}")