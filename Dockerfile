FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NT_QUOTE_HOST=0.0.0.0 \
    NT_QUOTE_NO_BROWSER=1

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY . ./
RUN mkdir -p /app/output /app/tmp /data

EXPOSE 8765

CMD ["python", "app.py"]

