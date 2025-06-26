FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy .env file if it exists
COPY .env* .env* ./

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Install additional package for environment variable handling
RUN pip install --no-cache-dir python-dotenv

# Command to run the application with environment variables
CMD ["sh", "-c", "python -c 'from dotenv import load_dotenv; load_dotenv()' && uvicorn main:app --host 0.0.0.0 --port 8000"]
