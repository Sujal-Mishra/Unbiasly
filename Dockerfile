# Use a slim, official Python runtime
FROM python:3.10-slim as builder

WORKDIR /app

# Install system utilities needed for building native C-extensions (like lime/numpy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements to maximize Docker layer caching
COPY Unbiasly/backend/requirements.txt .

# Install dependencies into the local user space
RUN pip install --no-cache-dir --user -r requirements.txt

# --- Final Production Stage ---
FROM python:3.10-slim

WORKDIR /app

# Copy installed libraries from builder stage
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Copy application source code
COPY Unbiasly/backend/app ./app

# Copy frontend static files
COPY Unbiasly/frontend /app/frontend

# Expose default port
EXPOSE 7860

# Start Uvicorn bound to 0.0.0.0 and port 7860 (Hugging Face default)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
