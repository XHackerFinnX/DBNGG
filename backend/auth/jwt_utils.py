from datetime import datetime, timedelta
import jwt
from auth.settings import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS

def create_access_token(admin_login: str):
    expire = datetime.now() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": admin_login, "exp": expire}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
