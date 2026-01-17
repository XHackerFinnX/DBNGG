import asyncio
import uvicorn
import os

from config import config
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from router.catalog import router as router_catalog
from router.cart import router as router_cart
from router.profile import router as router_profile
from router.map import router as router_map
from router.qrcode import router as router_qrcode
from router.error import router as router_error
from router.auth import router as router_auth

from bot.handler.commands import router as router_start

from task.db_task import background_task_db

from aiogram import Bot, Dispatcher
from aiogram.types import Update
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

bot = Bot(
    config.BOT_TOKEN.get_secret_value(),
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()

# Список для хранения задач
tasks = []

def is_event_loop_running():
    try:
        loop = asyncio.get_event_loop()
        return loop.is_running()
    except RuntimeError:
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    await bot.set_webhook(
        url=f"{config.WEBHOOK_URL}{config.WEBHOOK_PATH}",
        drop_pending_updates=True,
        allowed_updates=dp.resolve_used_update_types()
    )

    task = asyncio.create_task(background_task_db())
    tasks.append(task)

    try:
        yield
    except asyncio.CancelledError:
        print("Приложение завершает работу.")
    finally:
        await bot.session.close()

        if is_event_loop_running():
            for task in tasks:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    print("Таски отменены.")
        else:
            print("Цикл обработки событий замкнут, никаких задач для отмены нет.")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

app.mount(
    path="/static",
    app=StaticFiles(directory=os.path.join(FRONTEND_DIR, "static")),
    name="static"
)

# Запуск app для FastAPI
app.include_router(router_catalog)
app.include_router(router_cart)
app.include_router(router_profile)
app.include_router(router_map)
app.include_router(router_qrcode)
app.include_router(router_error)
app.include_router(router_auth)

# Запуск dp для Aiogram
dp.include_router(router_start)

@app.post(config.WEBHOOK_PATH)
async def webhooks(request: Request):
    update = Update.model_validate(
        await request.json(),
        context={'bot': bot}
    )
    await dp.feed_update(bot, update)

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(os.path.join(FRONTEND_DIR, "static", "fonts", "favicon.ico"))

if __name__ == "__main__":
    uvicorn.run(
        app=app,
        host=config.APP_HOST,
        port=config.APP_PORT
    )