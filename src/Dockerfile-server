FROM python:3.12

WORKDIR /server

COPY ./requirements.txt /server

RUN pip install --no-cache-dir --upgrade -r /server/requirements.txt

COPY ../../src /src
COPY ./main.py /server

CMD ["fastapi", "run", "main.py", "--port", "80"]