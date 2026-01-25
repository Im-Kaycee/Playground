FROM python:3.11-slim

WORKDIR /app

# Copy the requirements first to leverage Docker cache
COPY App/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# FastAPI usually runs on 8000
EXPOSE 8000
ENV PYTHONPATH=/app
# Adjust 'App.main:app' to match your actual entry point
CMD alembic -c App/alembic.ini upgrade head && \
    uvicorn App.main:app --host 0.0.0.0 --port 8000