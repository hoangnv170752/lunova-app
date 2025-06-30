from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import os
from openai import OpenAI
import json
from dotenv import load_dotenv

from models.database import get_db
from services.qdrant_service import QdrantService
from models.product_image import ProductImage
from models.product import Product

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

# OpenAI client is initialized above

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
    # Initialize variables to handle potential failures gracefully
    suggested_products_with_images = []
    suggested_shops = []
    detected_language = request.language or "en"
    response_text = "I'm sorry, I couldn't process your request at this time. Please try again later."
    
    try:
        # Step 1: Use OpenAI to understand the user's query and extract search parameters
        try:
            completion = openai_client.chat.completions.create(
                model="gpt-4.0-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Customer message: {request.message}\n\nAnalyze this message and extract search parameters for products and shops. IMPORTANT: Return ONLY a valid JSON object with no additional text, markdown formatting, or explanation. The JSON must follow this structure exactly: {{\"detected_language\": \"language_code\", \"product_search\": {{\"keywords\": [], \"categories\": [], \"features\": []}}, \"shop_search\": {{\"keywords\": [], \"features\": []}}, \"response_draft\": \"your draft response to the customer in their language\"}}"}
                ]
            )
        except Exception as e:
            print(f"Error calling OpenAI API: {str(e)}")
            return ChatResponse(
                response=f"I'm sorry, I couldn't process your request at this time. Please try again later.",
                suggested_products=suggested_products_with_images,
                suggested_shops=suggested_shops,
                detected_language=detected_language
            )
        
        # Parse the analysis
        try:
            # Get the raw content from OpenAI response
            raw_content = completion.choices[0].message.content
            
            # Try to extract JSON content - sometimes OpenAI adds markdown formatting or extra text
            # Look for content between triple backticks if present
            import re
            json_match = re.search(r'```(?:json)?\s*({[\s\S]*?})\s*```', raw_content)
            
            if json_match:
                # Extract JSON from code block
                json_str = json_match.group(1)
                analysis = json.loads(json_str)
            else:
                # Try to parse the entire content as JSON
                analysis = json.loads(raw_content)
                
            print("Successfully parsed OpenAI response")
        except Exception as e:
            print(f"Error parsing OpenAI API response: {str(e)}")
            print(f"Raw content: {raw_content[:500]}...")
            
            # Fallback to default values
            analysis = {
                "detected_language": request.language or "en",
                "product_search": {"keywords": [], "categories": [], "features": []},
                "shop_search": {"keywords": [], "features": []},
                "response_draft": "Thank you for your message. How can I help you today?"
            }
            
            # Return a friendly response
            return ChatResponse(
                response=f"I'm sorry, I couldn't process your request at this time. Please try again later.",
                suggested_products=suggested_products_with_images,
                suggested_shops=suggested_shops,
                detected_language=request.language or "en"
            )
        
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
            try:
                # Search in products collection
                product_results = qdrant_service.search_similar(
                    collection_name="products",
                    query_text=product_keywords,
                    limit=5
                )
                
                # Get product payloads
                product_payloads = [result["payload"] for result in product_results]
            except Exception as e:
                print(f"Error searching Qdrant for products: {str(e)}")
                product_payloads = []
            
            # Fetch images for each product
            for product_payload in product_payloads:
                product_id = product_payload.get("id")
                if product_id:
                    # Query product images with error handling and timeout management
                    try:
                        # Set a reasonable timeout for the query
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
                    except Exception as e:
                        # Log the error but continue with empty images
                        print(f"Error fetching images for product {product_id}: {str(e)}")
                        image_responses = []
                    
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
        
        # Step 4: Generate final response with OpenAI
        try:
            final_prompt = f"""
            You are a helpful virtual shop assistant for Lunova, a luxury marketplace.
            
            Customer message: {request.message}
            
            Based on the customer's message, I've found these products that might interest them:
            {json.dumps([p.product for p in suggested_products_with_images], indent=2)}
            
            And these shops:
            {json.dumps(suggested_shops, indent=2)}
            
            Draft response: {response_draft}
            
            Please generate a natural, helpful response in {detected_language} language that:
            1. Addresses the customer's query
            2. Mentions some of the suggested products if relevant (no need to list all of them)
            3. Is friendly and helpful
            4. Does not include ANY markdown formatting, code blocks, or JSON
            5. Is concise (maximum 3-4 sentences)
            6. IMPORTANT: Return ONLY plain text with no formatting or structure
            """
            
            # Get final response from OpenAI
            final_completion = openai_client.chat.completions.create(
                model="gpt-4.0-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful virtual shop assistant for Lunova, a luxury marketplace."},
                    {"role": "user", "content": final_prompt}
                ]
            )
            
            final_response = final_completion.choices[0].message.content
        except Exception as e:
            print(f"Error generating final response: {str(e)}")
            # Use the draft response or a fallback message
            if response_draft:
                final_response = response_draft
            else:
                final_response = f"Thank you for your message. We've found some products that might interest you. Please take a look at the suggestions below."
        
        return ChatResponse(
            response=final_response,
            suggested_products=suggested_products_with_images,
            suggested_shops=suggested_shops,
            detected_language=detected_language
        )
    except Exception as e:
        # Global error handler for any uncaught exceptions
        print(f"Unexpected error in chatbot API: {str(e)}")
        return ChatResponse(
            response="I'm sorry, I encountered an unexpected error. Please try again later.",
            suggested_products=[],
            suggested_shops=[],
            detected_language=request.language or "en"
        )
