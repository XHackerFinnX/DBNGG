import asyncio
import os
import uvicorn

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from config import config

from router.catalog import router as router_catalog
from router.admin import router as router_admin
from router.error import router as router_error
from router.delivery import router as router_cdek
from auth.auth import router as router_auth

from task.db_task import background_task_db


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

tasks: list[asyncio.Task] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    # запуск фоновых задач
    task = asyncio.create_task(background_task_db())
    tasks.append(task)

    try:
        yield
    finally:
        # корректная остановка задач
        for task in tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass


app = FastAPI(lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статика
app.mount(
    "/static",
    StaticFiles(directory=os.path.join(FRONTEND_DIR, "static")),
    name="static"
)

# Роутеры
app.include_router(router_catalog)
app.include_router(router_admin)
app.include_router(router_auth)
app.include_router(router_cdek)
app.include_router(router_error)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(
        os.path.join(FRONTEND_DIR, "static", "fonts", "favicon.ico")
    )


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=config.APP_HOST,
        port=config.APP_PORT
    )
