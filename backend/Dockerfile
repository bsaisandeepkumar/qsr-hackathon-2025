# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# system deps (opencv fallback if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ffmpeg libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# copy sources
COPY . /app

# pip
RUN python -m pip install --upgrade pip

# install core requirements (ultralytics commented out to keep image small)
RUN pip install fastapi==0.110.0 uvicorn[standard]==0.22.0 \
    pydantic==2.6.0 python-multipart==0.0.6 sqlalchemy==2.0.25 python-dotenv==1.0.1 \
    numpy scikit-learn

# Note: For full YOLO, uncomment and install ultralytics inside the container (heavy)
# RUN pip install ultralytics==8.2.0

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
