from sqlalchemy import Column, String, DateTime
from datetime import datetime, timezone
from database.database import Base

class DBTask(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    status = Column(String, default="TODO")
    priority = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    tags = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
