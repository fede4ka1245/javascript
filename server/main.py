from dotenv import load_dotenv

from src.database import create_database_session
from src.s3 import FileStorage
from src.init_app import init_app

from os import getenv

load_dotenv()

S3_ENDPOINT_URL = getenv("S3_ENDPOINT_URL")
S3_REGION = getenv("S3_REGION")
S3_ACCESS_KEY = getenv("S3_ACCESS_KEY")
S3_PRIVATE_ACCESS_KEY = getenv("S3_PRIVATE_ACCESS_KEY")
S3_BUCKET_NAME = getenv("S3_BUCKET_NAME")

DATABASE_HOST=getenv("DATABASE_HOST")
DATABASE_PORT=int(getenv("DATABASE_PORT"))
DATABASE_USER=getenv("DATABASE_USER")
DATABASE_PASSWORD=getenv("DATABASE_PASSWORD")
DATABASE_DBNAME=getenv("DATABASE_DBNAME")
DATABASE_DRIVER=getenv("DATABASE_DRIVER")


file_storge = FileStorage(S3_ENDPOINT_URL, S3_REGION, S3_ACCESS_KEY, S3_PRIVATE_ACCESS_KEY, S3_BUCKET_NAME)
database_session = create_database_session(DATABASE_DRIVER, DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_DBNAME)
app = init_app(file_storge, database_session)

# app.host("0.0.0.0", __name__)
