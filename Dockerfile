FROM python:3.12-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/
COPY scheduler.py .

# Run as non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

HEALTHCHECK --interval=60s --timeout=10s --retries=3 \
  CMD python -c "import os; os.path.exists('scheduler_progress.json')" || exit 1

# Run scheduler in loop mode (daily at 6:00)
CMD ["python", "scheduler.py"]
