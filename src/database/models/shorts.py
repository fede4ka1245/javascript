from dataclasses import dataclass

from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship

from .base import Base


@dataclass
class Short(Base):
    __tablename__ = "shorts"

    id = Column(Integer, nullable=False, primary_key=True, index=True, autoincrement=True)

    upload_id = Column(Integer, ForeignKey("uploads.id"), nullable=False)
    upload = relationship("Upload", back_populates="shorts")

    video_file_key = Column(String, nullable=True)
    subtitles_file_key = Column(String, nullable=True)

    state = Column(String, nullable=True)

    def as_dict(self) -> dict[str, any]:
        return {
            "id": self.id,
            "video_file_key": self.video_file_key,
            "subtitles_file_key": self.subtitles_file_key,
            "state": self.state
        }
