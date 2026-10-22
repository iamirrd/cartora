# Use Python 3.12 as the base image
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory inside the container
WORKDIR /app

# Install system dependencies (required for psycopg2 and Pillow)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    musl-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project files
COPY . /app/

# Collect static files (for production)
RUN python manage.py collectstatic --noinput

# Start the application with Gunicorn
CMD ["gunicorn", "Config.wsgi:application", "--bind", "0.0.0.0:8000"]