from dataclasses import dataclass
from sqlalchemy import Column, Integer, ForeignKey, String, func, DateTime, create_engine
from sqlalchemy.orm import relationship, DeclarativeBase, sessionmaker, Session, joinedload
from sqlalchemy.engine import URL
from sqlalchemy.exc import SQLAlchemyError
from fastapi import File, UploadFile, HTTPException, FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from src.mq import RabbitMQClient
from src.s3 import FileStorage

class Base(DeclarativeBase):
    pass

@dataclass
class Short(Base):
    __tablename__ = "shorts"

    id: int = Column(Integer, nullable=False, primary_key=True, index=True, autoincrement=True)
    upload_id: int = Column(Integer, ForeignKey("uploads.id"), nullable=False)
    upload = relationship("Upload", back_populates="shorts")
    video_file_key: str = Column(String, nullable=True)
    subtitles_file_key: str = Column(String, nullable=True)
    title: str = Column(String, nullable=True)
    description: str = Column(String, nullable=True)
    key_words_file_key: str = Column(String, nullable=True)
    interpretation: str = Column(String, nullable=True)
    state: str = Column(String, nullable=True)

    def as_dict(self) -> dict[str, any]:
        return {
            "id": self.id,
            "upload_id": self.upload_id,
            "video_file_key": self.video_file_key,
            "subtitles_file_key": self.subtitles_file_key,
            "title": self.title,
            "description": self.description,
            "interpretation": self.interpretation,
            "key_words_file_key": self.key_words_file_key,
            "state": self.state
        }

@dataclass
class Upload(Base):
    __tablename__ = "uploads"

    id: int = Column(Integer, nullable=False, primary_key=True, index=True, autoincrement=True)
    source_video_file_key: str = Column(String, nullable=False)
    creation_time: DateTime = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    upload_state: str = Column(String, nullable=True, server_default="uploaded")
    shorts = relationship("Short", back_populates="upload")

    def as_dict(self) -> dict[str, any]:
        return {
            "id": self.id,
            "source_video_file_key": self.source_video_file_key,
            "state": self.upload_state
        }

def create_database_session(
        database_driver_name: str,
        database_host: str,
        database_port: int,
        database_username: str,
        database_password: str,
        database_name: str
) -> Session:
    database_url = URL.create(
        drivername=database_driver_name,
        username=database_username,
        password=database_password,
        host=database_host,
        database=database_name,
        port=database_port
    )
    engine = create_engine(database_url)
    make_db_session = sessionmaker(autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    return make_db_session()

def get_uploads(database_session: Session):
    return database_session.query(Upload).all()

def get_upload(database_session: Session, upload_id: int):
    return database_session.query(Upload).options(joinedload(Upload.shorts)).get(upload_id)

def create_upload(database_session: Session, source_video_file_key: str):
    upload = Upload(source_video_file_key=source_video_file_key, upload_state="uploaded")
    database_session.add(upload)
    database_session.commit()
    return upload.id

def get_shorts(database_session: Session, upload_id: int):
    upload = database_session.get(Upload, upload_id)
    if upload is None:
        raise HTTPException(status_code=404, detail="Upload not found")
    return upload.shorts

def create_short(database_session: Session, upload_id: int, video_file_key: str | None, subtitles_file_key: str | None, state: str | None = None):
    if state is None and subtitles_file_key is not None:
        state = "subtitles"
    elif state is None and video_file_key is not None:
        state = "video"

    short = Short(upload_id=upload_id, video_file_key=video_file_key, subtitles_file_key=subtitles_file_key, state=state)
    database_session.add(short)
    database_session.commit()
    return short.id

def pathify_api_object(api_object: dict[str, any], file_storage: FileStorage):
    paths_dict = {}
    for api_object_property_name, api_object_property_value in api_object.items():
        if api_object_property_name.endswith("_file_key") and isinstance(api_object_property_value, str):
            name = api_object_property_name.replace("_file_key", "_file_path", 1)
            path = file_storage.get_file_path(api_object_property_value)
            paths_dict[name] = path
    return {**api_object, **paths_dict}

def init_app(file_storage: FileStorage, database_session: Session, message_queue_client: RabbitMQClient = None):
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.post("/upload")
    def upload(file: UploadFile = File(...)):
        try:
            file.file.seek(0)
            file_key = file_storage.upload_file(file.file, file.filename[file.filename.index('.'):])
            upload_id = create_upload(database_session, file_key)
            if message_queue_client is not None:
                message_queue_client.publish_message(str(upload_id))
            return upload_id
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Error during file upload: {error}")
        finally:
            file.file.close()

    @app.get("/uploads")
    def get_uploads_endpoint():
        try:
            uploads = get_uploads(database_session)
            return list(map(lambda obj: pathify_api_object(obj.as_dict(), file_storage), uploads))
        except SQLAlchemyError as e:
            database_session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    @app.get("/uploads/{upload_id}")
    def get_upload_endpoint(upload_id: int):
        try:
            upload = get_upload(database_session, upload_id)
            if upload is None:
                raise HTTPException(status_code=404, detail="Upload not found")
            return pathify_api_object(upload.as_dict(), file_storage)
        except SQLAlchemyError as e:
            database_session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    @app.get("/uploads/{upload_id}/shorts")
    def get_upload_shorts_endpoint(upload_id: int):
        try:
            upload = get_upload(database_session, upload_id)
            if upload is None:
                raise HTTPException(status_code=404, detail="Upload not found")

            shorts = get_shorts(database_session, upload_id)
            return list(map(lambda obj: pathify_api_object(obj.as_dict(), file_storage), shorts))

        except SQLAlchemyError as e:
            database_session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    @app.post("/assets/upload")
    def upload_asset(file: UploadFile = File(...)):
        try:
            file.file.seek(0)
            file_key = file_storage.upload_file(file.file, file.filename[file.filename.index('.'):])
            return file_storage.get_file_path(file_key)
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Error during file upload: {error}")
        finally:
            file.file.close()

    @app.get("/assets/{file_key}")
    def get_asset(file_key: str):
        return RedirectResponse(file_storage.get_file_url(file_key))

    return app
