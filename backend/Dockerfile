FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8080

# Install only minimal runtime OpenMP library required for CPU matrix math (TensorFlow / Scikit-Learn)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv package manager
RUN pip install --no-cache-dir uv

# Copy dependency specifications first to leverage Docker layer caching
COPY pyproject.toml uv.lock ./

# Install only pure CPU python dependencies (no CUDA, no Kokoro, no OpenCV GUI bloat)
RUN uv sync --frozen --no-dev

# Pre-download minimal sentence-transformer weights and NLTK punkt tokenizer for instant startup
RUN uv run python -c "import nltk; nltk.download('punkt_tab', quiet=True); from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

# Copy application code, models, and assets
COPY . .

EXPOSE 8080

CMD ["sh", "-c", "uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --timeout-keep-alive 65"]
