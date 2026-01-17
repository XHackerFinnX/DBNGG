import io
import json
import hmac
import hashlib
import base64
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import RadialGradiantColorMask
from PIL import Image

SECRET_KEY = b"ASDFG-FFW25-GGHGS-ZXCVF"

def sign_data(data: dict) -> dict:
    raw = json.dumps(data, ensure_ascii=False, sort_keys=True)
    sig = base64.b64encode(
        hmac.new(SECRET_KEY, raw.encode(), hashlib.sha256).digest()
    ).decode()
    return {"data": data, "sig": sig}

def build_qr_png(payload: str) -> bytes:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=0
    )
    qr.add_data(payload)
    qr.make(fit=True)

    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        color_mask=RadialGradiantColorMask(
            back_color=(40, 39, 39),
            center_color=(255, 255, 255),
            edge_color=(255, 255, 255)
        )
    )

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def generate_qr_sync(client_id: int, points: int, name: str | None):
    client_data = {
        "client_id": client_id,
        "points": points,
        "name": name
    }

    payload = sign_data(client_data)
    qr_payload = json.dumps(payload, ensure_ascii=False)
    return build_qr_png(qr_payload)