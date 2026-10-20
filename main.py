from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from database.database import engine, Base
from routers import tasks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="UniTasker API")

# Підключаємо статичні файли (CSS та JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(tasks.router)

@app.get("/")
def read_root():
    return FileResponse("templates/index.html")
