FROM python:3.12

WORKDIR /server

COPY ./services/server/requirements.txt /server/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /server/requirements.txt

COPY ./src /src
COPY ./services/server/main.py /server/main.py

CMD ["fastapi", "run", "main.py", "--port", "80"]