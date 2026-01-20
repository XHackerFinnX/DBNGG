from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr


class Settings(BaseSettings):
    # PostgreSQL
    POSTGRESQL_USER: SecretStr
    POSTGRESQL_PASSWORD: SecretStr
    POSTGRESQL_HOST: SecretStr
    POSTGRESQL_PORT: SecretStr
    POSTGRESQL_DATABASE: SecretStr
    CDEK_CLIENT_ID: SecretStr
    CDEK_CLIENT_SECRET: SecretStr

    # Локальный запуск
    APP_HOST: str = "localhost"

    # Продакшен
    # APP_HOST: str = "0.0.0.0"

    APP_PORT: int = 8000

    model_config: SettingsConfigDict = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


config = Settings()
