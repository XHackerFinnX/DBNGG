import os
import secrets

SECRET_KEY = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
