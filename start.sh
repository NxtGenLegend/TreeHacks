#!/bin/bash

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    # Start Redis only if it's not running
    echo "Starting Redis..."
    redis-server --save "" --appendonly no &
    sleep 5
else
    echo "Redis is already running..."
fi

# Start Celery in the background
echo "Starting Celery worker..."
celery -A app:celery_app worker --loglevel=info &

# Start FastAPI
echo "Starting FastAPI server..."
uvicorn app:app --reload --port 8010 --host 0.0.0.0