from dataclasses import dataclass

from sqlalchemy import Column, Integer, ForeignKey, String, func, DateTime, BigInteger
from sqlalchemy.orm import relationship

from .base import Base


@dataclass
class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, nullable=False, primary_key=True, index=True, autoincrement=True)

    source_video_file_key = Column(String, nullable=False)
    creation_time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    upload_state = Column(String, nullable=True, server_default="uploaded")

    shorts = relationship("Short", back_populates="upload")

    def as_dict(self) -> dict[str, any]:
        return {
            "id": self.id,
            "source_video_file_key": self.source_video_file_key,
            "state": self.upload_state
        }