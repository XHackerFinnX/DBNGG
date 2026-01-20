import httpx
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, date
from services.cdek_pvz import get_pvz_by_city
from config import config

router = APIRouter(
    prefix="/api/delivery",
    tags=["CDEK"]
)

CDEK_TOKEN_URL = "https://api.cdek.ru/v2/oauth/token"
CDEK_CALC_URL = "https://api.cdek.ru/v2/calculator/tariff"

CLIENT_ID = config.CDEK_CLIENT_ID.get_secret_value()
CLIENT_SECRET = config.CDEK_CLIENT_SECRET.get_secret_value()

FROM_POSTAL_CODE = "143911"
TARIFF_CODE = 136
DAY_DELIVERY = 10
FINAL_MARKUP = 150

PACKAGES = [
    {
        "weight": 1000,
        "length": 30,
        "width": 20,
        "height": 8,
    }
]

# ================== КЭШ ТОКЕНА ==================

_cdek_token: str | None = None
_cdek_token_expire: datetime | None = None


async def get_cdek_token() -> str:
    global _cdek_token, _cdek_token_expire

    if _cdek_token and _cdek_token_expire and _cdek_token_expire > datetime.utcnow():
        return _cdek_token

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(
            CDEK_TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    if res.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"CDEK auth error: {res.text}",
        )

    data = res.json()

    _cdek_token = data["access_token"]
    _cdek_token_expire = datetime.now() + timedelta(
        seconds=data.get("expires_in", 3600) - 60
    )

    return _cdek_token


@router.post("/calculate")
async def calc_delivery(data: dict):
    """
    data = {
        "postal_code": "196632"
    }
    """

    to_postal_code = data.get("postal_code")

    if not to_postal_code:
        raise HTTPException(status_code=400, detail="postal_code is required")

    token = await get_cdek_token()

    date_iso = (datetime.now() + timedelta(days=DAY_DELIVERY)).strftime(
        "%Y-%m-%dT%H:%M:%S+0300"
    )

    payload = {
        "date": date_iso,
        "type": 1,
        "currency": 1,
        "lang": "rus",
        "tariff_code": TARIFF_CODE,
        "from_location": {
            "postal_code": FROM_POSTAL_CODE,
        },
        "to_location": {
            "postal_code": str(to_postal_code),
        },
        "packages": PACKAGES,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(
            CDEK_CALC_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )

    if res.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"CDEK calc error: {res.text}",
        )

    result = res.json()

     # ===== ЦЕНА =====
    base_price = result.get("total_sum") or result.get("delivery_sum")
    if base_price is None:
        raise HTTPException(status_code=500, detail="Invalid CDEK response")

    FINAL_MARKUP = 150
    final_price = round(base_price + FINAL_MARKUP)

    # ===== ДНИ ДОСТАВКИ =====
    delivery_date_min = result.get("delivery_date_range", {}).get("min")

    if delivery_date_min:
        delivery_date = datetime.strptime(delivery_date_min, "%Y-%m-%d").date()
        days = (delivery_date - date.today()).days
        if days < 0:
            days = 0
    else:
        # fallback (на всякий случай)
        days = result.get("calendar_min", 0)

    return {
        "price": final_price,
        "days": days,
    }



@router.get("/pvz")
async def pvz(postalCode: str):
    try:
        return get_pvz_by_city(postalCode)
    except Exception as e:
        raise HTTPException(500, detail=str(e))
