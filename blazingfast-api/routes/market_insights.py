from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/market-insights",
    tags=["market-insights"],
    responses={404: {"description": "Not found"}},
)

class MarketInsightRequest(BaseModel):
    category: str
    specific_query: Optional[str] = None
    region: Optional[str] = "global"

class ProductSuggestionRequest(BaseModel):
    shop_type: str
    target_audience: Optional[str] = None
    price_range: Optional[str] = None
    season: Optional[str] = None

class InsightResponse(BaseModel):
    insights: Dict[str, Any]
    sources: List[Dict[str, str]]

# Get Perplexity API key from environment variables
PPLX_API_KEY = os.getenv("PPLX_API_KEY")
if not PPLX_API_KEY:
    raise ValueError("PPLX_API_KEY environment variable not set")

def query_perplexity_api(prompt: str) -> Dict[str, Any]:
    """
    Query the Perplexity API with the given prompt
    """
    headers = {
        "Authorization": f"Bearer {PPLX_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "sonar",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1000
    }
    
    response = requests.post(
        "https://api.perplexity.ai/chat/completions",
        headers=headers,
        json=payload
    )
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"Perplexity API error: {response.text}")
    
    result = response.json()
    print(result)
    
    # Extract the response and sources
    try:
        answer = result["choices"][0]["message"]["content"]
        
        # Try to extract sources from citations if available
        sources = []
        if "citations" in result:
            sources = [{"url": url} for url in result["citations"]]
        
        # Extract JSON from markdown code blocks if present
        import re
        json_match = re.search(r'```json\n(.*?)\n```', answer, re.DOTALL)
        
        if json_match:
            # Found JSON in code block
            json_str = json_match.group(1)
            try:
                parsed_answer = json.loads(json_str)
                return {"insights": parsed_answer, "sources": sources}
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON from code block: {e}")
                # Fall through to next parsing attempt
        
        # If no code block or parsing failed, try parsing the entire answer
        try:
            parsed_answer = json.loads(answer)
            return {"insights": parsed_answer, "sources": sources}
        except json.JSONDecodeError:
            # If not JSON, return as text
            return {"insights": {"text": answer}, "sources": sources}
            
    except (KeyError, IndexError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Perplexity API response: {str(e)}")

@router.post("/market-data", response_model=InsightResponse)
async def get_market_insights(request: MarketInsightRequest):
    """
    Get market insights for a specific category using Perplexity Sonar Pro
    """
    # Construct a detailed prompt for market insights
    prompt = f"""
    Please provide detailed market insights about {request.category} with real, up-to-date numbers and statistics.
    
    {f"Specifically focus on: {request.specific_query}" if request.specific_query else ""}
    {f"For the region: {request.region}" if request.region != "global" else "Include global data and trends."}
    
    Include the following information:
    1. Current average prices and price trends
    2. Market size and growth rate
    3. Key market players and their market share
    4. Recent significant developments or changes in the market
    5. Consumer behavior and preferences
    
    Format your response as JSON with the following structure:
    {{
      "market_size": "Value with unit",
      "growth_rate": "Percentage",
      "average_price": "Value with currency",
      "price_trend": "Description of trend",
      "key_players": ["Player 1", "Player 2", ...],
      "recent_developments": ["Development 1", "Development 2", ...],
      "consumer_insights": ["Insight 1", "Insight 2", ...]
    }}
    
    Ensure all data is factual, recent, and includes specific numbers where applicable.
    """
    
    return query_perplexity_api(prompt)

@router.post("/product-suggestions", response_model=InsightResponse)
async def get_product_suggestions(request: ProductSuggestionRequest):
    """
    Get product suggestions that could be best-selling for a specific shop type
    """
    # Construct a detailed prompt for product suggestions
    prompt = f"""
    Based on current market trends and consumer behavior, suggest products that could be best-selling for a {request.shop_type} shop.
    
    {f"Target audience: {request.target_audience}" if request.target_audience else ""}
    {f"Price range: {request.price_range}" if request.price_range else ""}
    {f"Season: {request.season}" if request.season else ""}
    
    Please provide:
    1. Top 10 product recommendations with estimated price points and profit margins
    2. Why these products are trending or expected to sell well
    3. Specific features or variations that are most popular
    4. Marketing strategies that work well for these products
    
    Format your response as JSON with the following structure:
    {{
      "product_recommendations": [
        {{
          "product_name": "Product name",
          "estimated_price": "Price range with currency",
          "estimated_margin": "Percentage",
          "popularity_reason": "Why this product sells well",
          "popular_features": ["Feature 1", "Feature 2", ...],
          "marketing_tips": ["Tip 1", "Tip 2", ...]
        }},
        ...
      ],
      "overall_trends": ["Trend 1", "Trend 2", ...],
      "seasonal_factors": ["Factor 1", "Factor 2", ...]
    }}
    
    Ensure all suggestions are backed by real market data and current trends.
    """
    
    return query_perplexity_api(prompt)

@router.get("/categories")
async def get_available_categories():
    """
    Get a list of categories for which market insights are available
    """
    categories = [
        "jewelry",
        "gasoline",
        "electronics",
        "fashion",
        "home decor",
        "beauty products",
        "fitness equipment",
        "organic food",
        "luxury goods",
        "sustainable products"
    ]
    
    return {"categories": categories}
