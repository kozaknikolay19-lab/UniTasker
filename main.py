from fastapi import FastAPI
from database.database import engine, Base
from routers import tasks

# Створюємо таблиці в базі даних при запуску
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UniTasker API")

# Підключаємо маршрути
app.include_router(tasks.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to UniTasker API"}
