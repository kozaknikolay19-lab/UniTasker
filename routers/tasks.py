from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import uuid4
import io
import csv
from database.database import get_db
from database.models import DBTask
from database.schemas import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = DBTask(
        id=str(uuid4()),
        title=task.title,
        description=task.description,
        priority=task.priority,
        deadline=task.deadline,
        tags=task.tags
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/", response_model=list[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(DBTask).all()

@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}

@router.put("/{task_id}")
def update_status(task_id: str, task_update: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db_task.status = task_update.status
    db.commit()
    return {"message": "Status updated"}

@router.get("/export/csv")
def export_tasks_csv(db: Session = Depends(get_db)):
    tasks = db.query(DBTask).all()
    output = io.StringIO()
    writer = csv.writer(output)
    # Заголовки колонок у файлі
    writer.writerow(["Назва", "Статус", "Пріоритет", "Дедлайн"])
    
    for task in tasks:
        deadline_str = task.deadline.strftime("%Y-%m-%d") if task.deadline else "Немає"
        writer.writerow([task.title, task.status, task.priority, deadline_str])
        
    output.seek(0)
    return StreamingResponse(
        output, 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=unitasker_tasks.csv"}
    )
