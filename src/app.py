from fastapi import File, UploadFile, HTTPException, FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from src.database import Session,\
    create_upload, create_short, \
    get_uploads as get_uploads_from_database, \
    get_upload as get_upload_from_database, \
    get_shorts as get_shorts_from_database

from src.mq import RabbitMQClient

from src.s3 import FileStorage

from sqlalchemy.exc import SQLAlchemyError

# Функция для добавления путей до файлов, хранимых в S3, для любой модели, содержащей ключи
def pathify_api_object(api_object: dict[str, any], file_storage: FileStorage):
    paths_dict = dict[str, str]()
    for api_object_property_name, api_object_property_value in api_object.items():
        if api_object_property_name.endswith("_file_key") and isinstance(api_object_property_value, str):
            name = api_object_property_name.replace("_file_key", "_file_path", 1)
            path = file_storage.get_file_path(api_object_property_value)
            paths_dict[name] = path
    return api_object | paths_dict


# Функция инициализации API сервера
def init_app(file_storage: FileStorage, database_session: Session, message_queue_client: RabbitMQClient = None):
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Метод для загрузки исходного видео
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

    # Метод для получения загруженных видео
    @app.get("/uploads")
    def get_uploads():
        try:
          return list(map(lambda object: pathify_api_object(object.as_dict(), file_storage), get_uploads_from_database(database_session)))
        except SQLAlchemyError as e:
            # Handle the error (e.g., log it, re-raise it, etc.)
            database_session.rollback()  # Rollback the transaction
            raise HTTPException(status_code=500, detail="Server error")
        except Exception as e:
            raise HTTPException(status_code=500, detail="Server error")

    # Метод для получения информации по конкретному загруженному видео
    @app.get("/uploads/{upload_id}")
    def get_upload(upload_id: int):
        try:
            upload = get_upload_from_database(database_session, upload_id)
            if upload is None:
                raise HTTPException(status_code=404, detail="Upload not found")

            return pathify_api_object(upload.as_dict(), file_storage)
        except SQLAlchemyError as e:
            # Handle the error (e.g., log it, re-raise it, etc.)
            database_session.rollback()  # Rollback the transaction
            raise HTTPException(status_code=500, detail="Server error")
        except Exception as e:
            raise HTTPException(status_code=500, detail="Server error")

    # Метод для получения клипов от загруженного видео
    @app.get("/uploads/{upload_id}/shorts")
    def get_upload_shorts(upload_id: int):
        try:
            return list(map(lambda object: pathify_api_object(object.as_dict(), file_storage), get_shorts_from_database(database_session, upload_id)))
        except SQLAlchemyError as e:
            # Handle the error (e.g., log it, re-raise it, etc.)
            database_session.rollback()  # Rollback the transaction
            raise HTTPException(status_code=500, detail="Server error")
        except Exception as e:
            raise HTTPException(status_code=500, detail="Server error")

    # Метод для загрузки файлов в S3
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

    # Метод для загрузки файлов из S3
    @app.get("/assets/{file_key}")
    def get_asset(file_key: str):
        return RedirectResponse(file_storage.get_file_url(file_key))

    return app
