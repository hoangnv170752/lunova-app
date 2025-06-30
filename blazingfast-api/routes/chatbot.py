from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import os
import openai
import json
from dotenv import load_dotenv

from models.database import get_db
from services.qdrant_service import QdrantService
from models.product_image import ProductImage
from models.product import Product

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/chatbot",
    tags=["chatbot"],
)

# Pydrant models for request/response
class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None
    
    class Config:
        # Make all fields optional in validation
        extra = "ignore"

class ProductImageResponse(BaseModel):
    id: str
    image_url: str
    is_primary: bool
    alt_text: Optional[str] = None

class ProductWithImages(BaseModel):
    product: Dict[str, Any]
    images: List[ProductImageResponse] = []

class ChatResponse(BaseModel):
    response: str
    suggested_products: List[ProductWithImages] = []
    suggested_shops: List[Dict[str, Any]] = []
    detected_language: Optional[str] = None

# Initialize OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Qdrant service
qdrant_service = QdrantService()

SYSTEM_PROMPT = """
You are Lunova's virtual shop assistant, helping customers find products and shops that match their needs.
Your goal is to understand customer inquiries (which may be in various languages) and provide helpful recommendations.

Follow these steps:
1. Understand the customer's request, which may be in any language
2. Identify key product attributes they're looking for (category, price range, features, etc.)
3. Identify any shop preferences they might have
4. Respond in the same language as their query
5. Be friendly, helpful, and concise

When suggesting products or shops, explain briefly why you're recommending them.
"""

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Process a chat message and return a response with product and shop suggestions.
    """
    try:
        # Step 1: Use OpenAI to understand the user's query and extract search parameters
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Customer message: {request.message}\n\nAnalyze this message and extract search parameters for products and shops. Return your analysis as JSON with the following structure: {{\"detected_language\": \"language_code\", \"product_search\": {{\"keywords\": [], \"categories\": [], \"features\": []}}, \"shop_search\": {{\"keywords\": [], \"features\": []}}, \"response_draft\": \"your draft response to the customer in their language\"}}"}
            ]
        )
        
        # Parse the analysis
        analysis = json.loads(completion['choices'][0]['message']['content'])
        detected_language = analysis.get("detected_language", request.language)
        product_search = analysis.get("product_search", {})
        shop_search = analysis.get("shop_search", {})
        response_draft = analysis.get("response_draft", "")
        
        # Step 2: Search for relevant products in Qdrant
        product_keywords = " ".join(product_search.get("keywords", []) + 
                                   product_search.get("categories", []) + 
                                   product_search.get("features", []))
        
        suggested_products_with_images = []
        if product_keywords:
            # Search in products collection
            product_results = qdrant_service.search_similar(
                collection_name="products",
                query_text=product_keywords,
                limit=5
            )
            
            # Get product payloads
            product_payloads = [result["payload"] for result in product_results]
            
            # Fetch images for each product
            for product_payload in product_payloads:
                product_id = product_payload.get("id")
                if product_id:
                    # Query product images
                    product_images = db.query(ProductImage).filter(ProductImage.product_id == product_id).all()
                    
                    # Convert to response format
                    image_responses = [
                        ProductImageResponse(
                            id=str(img.id),
                            image_url=img.image_url,
                            is_primary=img.is_primary,
                            alt_text=img.alt_text
                        ) for img in product_images
                    ]
                    
                    # Add product with its images to the list
                    suggested_products_with_images.append(
                        ProductWithImages(
                            product=product_payload,
                            images=image_responses
                        )
                    )
        
        # Step 3: Search for relevant shops in Qdrant
        shop_keywords = " ".join(shop_search.get("keywords", []) + 
                                shop_search.get("features", []))
        
        suggested_shops = []
        if shop_keywords:
            # Search in shops collection
            shop_results = qdrant_service.search_similar(
                collection_name="shops",
                query_text=shop_keywords,
                limit=3
            )
            suggested_shops = [result["payload"] for result in shop_results]
        
        # Step 4: Generate final response with OpenAI using the search results
        # Extract just the product data for the prompt (without images)
        product_data = [item.product for item in suggested_products_with_images[:3]] if suggested_products_with_images else []
        product_info = json.dumps(product_data) if product_data else "[]"
        shop_info = json.dumps(suggested_shops[:2]) if suggested_shops else "[]"
        
        final_completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.message},
                {"role": "assistant", "content": response_draft},
                {"role": "system", "content": f"Here are some products that match the query: {product_info}\n\nHere are some shops that match the query: {shop_info}\n\nIncorporate these suggestions naturally into your response if they're relevant. If they're not relevant, don't mention them. Respond in the same language as the user's query."}
            ]
        )
        
        final_response = final_completion['choices'][0]['message']['content']
        
        return ChatResponse(
            response=final_response,
            suggested_products=suggested_products_with_images,
            suggested_shops=suggested_shops,
            detected_language=detected_language
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")
