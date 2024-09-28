from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import URL

from .models import *

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
    return database_session.get(Upload, upload_id)

def create_upload(database_session: Session, source_video_file_key: str):
    upload = Upload(source_video_file_key=source_video_file_key, upload_state="uploaded")
    database_session.add(upload)
    database_session.commit()
    return upload.id

def get_shorts(database_session: Session, upload_id: int):
    return database_session.get(Upload, upload_id).shorts

def create_short(database_session: Session, upload_id: int, video_file_key: str | None, subtitles_file_key: str | None, state: str | None = None):
    if state is None and subtitles_file_key is not None:
        state = "subtitles"
    elif state is None and video_file_key is not None:
        state = "video"

    short = Short(upload_id=upload_id, video_file_key=video_file_key, subtitles_file_key=subtitles_file_key, state=state)
    database_session.add(short)
    database_session.commit()
    return short.id

