import asyncpg
from config import config
from log.log import setup_logger

logger = setup_logger("Database-connect")


class DataBase:
    def __init__(self):
        self._pool = None

    async def connect(self):
        """Подключение к БД с пулом"""
        if not self._pool:
            try:
                logger.info("Попытка подключения к базе данных...")
                self._pool = await asyncpg.create_pool(
                    host=config.POSTGRESQL_HOST.get_secret_value(),
                    database=config.POSTGRESQL_DATABASE.get_secret_value(),
                    user=config.POSTGRESQL_USER.get_secret_value(),
                    password=config.POSTGRESQL_PASSWORD.get_secret_value(),
                    port=config.POSTGRESQL_PORT.get_secret_value(),
                    min_size=20,
                    max_size=100,
                    max_queries=200000,
                    timeout=20,
                    command_timeout=60
                )
                logger.info("Соединение с БД установлено.")

                await self.create_tables()

            except Exception as e:
                logger.error(f"Ошибка подключения к БД: {e}")
                self._pool = None
                raise

        return self._pool

    async def get_pool(self):
        if not self._pool:
            await self.connect()
        return self._pool

    async def close(self):
        if self._pool:
            await self._pool.close()
            self._pool = None
            logger.info("Пул соединений закрыт.")

    async def create_tables(self):
        """Создание таблиц онлайн-магазина"""
        if not self._pool:
            logger.error("Пул соединений не инициализирован.")
            return

        try:
            async with self._pool.acquire() as connection:
                await connection.execute("""
                -- Пользователи
                CREATE TABLE IF NOT EXISTS public."user" (
                    user_id BIGSERIAL PRIMARY KEY,
                    fio VARCHAR(255) NOT NULL,
                    tg_name VARCHAR(255),
                    telephone VARCHAR(20),
                    email VARCHAR(255)
                );

                -- Заявки клиентов
                CREATE TABLE IF NOT EXISTS public.client_request (
                    req_id BIGSERIAL PRIMARY KEY,

                    user_id BIGINT REFERENCES public."user"(user_id) ON DELETE CASCADE,

                    fio VARCHAR(255),
                    tg_name VARCHAR(255),
                    telephone VARCHAR(20),
                    email VARCHAR(255),

                    city VARCHAR(255),
                    point VARCHAR(255),
                    full_name VARCHAR(255),
                    comment TEXT,

                    product JSONB NOT NULL,

                    amount INTEGER,
                    delivery_amount INTEGER,
                    total_amount INTEGER,

                    created_at TIMESTAMP DEFAULT NOW()
                );

                -- Статусы платежей
                CREATE TABLE IF NOT EXISTS public.payment_status (
                    pay_id BIGSERIAL PRIMARY KEY,

                    req_id BIGINT REFERENCES public.client_request(req_id) ON DELETE CASCADE,
                    user_id BIGINT REFERENCES public."user"(user_id) ON DELETE CASCADE,

                    status VARCHAR(255),
                    successfully BOOLEAN DEFAULT FALSE,
                    error BOOLEAN DEFAULT FALSE,

                    payment_text VARCHAR(255),
                    ip_address_user VARCHAR(255),
                    pay_url TEXT,

                    created_at TIMESTAMP DEFAULT NOW()
                );

                -- Каталог товаров
                CREATE TABLE IF NOT EXISTS public.product_catalog (
                    product_id BIGSERIAL PRIMARY KEY,

                    article VARCHAR(255),
                    name VARCHAR(255),

                    sizes TEXT[],
                    parameter VARCHAR(255),

                    status VARCHAR(255),
                    weight VARCHAR(255),

                    available BOOLEAN DEFAULT TRUE,
                    count INTEGER,
                    price INTEGER,

                    images TEXT[]
                );

                -- Администраторы
                CREATE TABLE IF NOT EXISTS public.admin_user (
                    admin_id BIGSERIAL PRIMARY KEY,

                    login VARCHAR(255) UNIQUE NOT NULL,
                    password TEXT NOT NULL,

                    status VARCHAR(50),
                    ip_address_user VARCHAR(255),
                    last_date TIMESTAMP
                );
                """)

                logger.info("Все таблицы успешно созданы или уже существуют.")

        except Exception as e:
            logger.error(f"Ошибка при создании таблиц: {e}")
            raise