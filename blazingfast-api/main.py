from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Load environment variables before importing app modules that read config at import time.
load_dotenv()
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from models import Base, engine
from routes import product_router, shop_router, product_image_router, product_tryon_image_router, storage_router, user_setting_router, market_insights_router, ticket_router, ticket_response_router, chatbot_router, ar_tryon_router

# Create tables in the database (skip if DB unreachable, e.g. DNS/network)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    import warnings
    warnings.warn(f"DB connection failed at startup (tables may already exist): {e}")

# Create FastAPI app
app = FastAPI(
    title="Lunova API",
    description="API for Lunova e-commerce application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(product_router)
app.include_router(shop_router)
app.include_router(product_image_router)
app.include_router(product_tryon_image_router)
app.include_router(storage_router)
app.include_router(user_setting_router)
app.include_router(market_insights_router)
app.include_router(ticket_router)
app.include_router(ticket_response_router)
app.include_router(chatbot_router)
app.include_router(ar_tryon_router)


# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to Lunova API"}

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Run the application
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
