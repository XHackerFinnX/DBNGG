from cdek.api import CDEKClient
from config import config


cdek_client = CDEKClient(
    account=config.CDEK_CLIENT_ID.get_secret_value(),
    secure_password=config.CDEK_CLIENT_SECRET.get_secret_value()
)
