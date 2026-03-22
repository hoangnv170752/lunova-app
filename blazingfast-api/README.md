# Lunova API Deployment Guide

This guide explains how to deploy the Lunova API using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- PostgreSQL database (can be provided by Docker Compose or use Supabase)
- Environment variables properly configured

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/lunova
VITE_OPENWEATHER_KEY=your_openweather_api_key
```

If you're using Supabase, update the `POSTGRES_URL` accordingly.

### AR try-on (Haar face + jewellery overlay)

- **Docs:** [docs/AR_TRYON_MODEL.md](./docs/AR_TRYON_MODEL.md) — how `haarcascade_frontalface_default.xml` is loaded and used.
- **Endpoints:** `GET /ar-tryon/presets`, `POST /ar-tryon/compose` (multipart: `image`, optional `overlay` or `jewellery_id`).

**If you get "could not translate host name ... supabase.co":**  
Use the **connection pooler** URL from Supabase instead of the direct DB host. In Supabase: **Project Settings → Database → Connection string → URI**, then choose **Session** or **Transaction** (pooler). It uses a host like `aws-0-<region>.pooler.supabase.com` and port **6543**, which often resolves when the direct `db.*.supabase.co` host does not. Also ensure the project is not paused (free tier projects pause after inactivity).

## Building and Running with Docker

### Option 1: Using Docker Compose (Development)

This will start both the API and a PostgreSQL database:

```bash
docker-compose up
```

### Option 2: Building and Running the API Container Only

If you're using an external database like Supabase:

1. Build the Docker image:
   ```bash
   docker build -t lunova-api .
   ```

2. Run the container:
   ```bash
   docker run -p 8000:8000 --env-file .env lunova-api
   ```

## API Documentation

Once the API is running, you can access the interactive API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

The application automatically creates tables on startup. If you need to make schema changes, update the SQLAlchemy models and restart the application.

## Production Deployment

For production deployment, consider:

1. Using a production-ready ASGI server like Gunicorn with Uvicorn workers
2. Setting up proper logging
3. Implementing rate limiting
4. Adding authentication middleware
5. Using a reverse proxy like Nginx
