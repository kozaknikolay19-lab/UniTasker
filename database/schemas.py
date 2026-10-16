from pydantic import BaseModel, Field
from datetime import datetime

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    priority: str | None = None
    deadline: datetime | None = None
    tags: str | None = None

class TaskResponse(BaseModel):
    id: str
    title: str
    status: str
    created_at: datetime
    class Config:
        from_attributes = True
