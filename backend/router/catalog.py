import os
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import APIRouter, Request
from log.log import setup_logger

router = APIRouter(
    prefix="",
    tags=["Catalog"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "frontend", "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)
logger = setup_logger("Router/catalog")

@router.get("/", response_class=HTMLResponse)
async def get_catalog(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})