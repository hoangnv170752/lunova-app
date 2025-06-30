from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import httpx
import uuid
from datetime import datetime
import base64
import mimetypes
import io
import openai
from dotenv import load_dotenv
from PIL import Image
import requests
from io import BytesIO

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter(
    prefix="/storage",
    tags=["storage"],
)

# Supabase storage configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
STORAGE_BUCKET = "images"

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("products"),  # Default folder inside the bucket
    enhance: bool = Form(False)  # Option to enhance image with AI
):
    """
    Upload a file to Supabase Storage and return the URL.
    
    - file: The file to upload
    - folder: Optional folder path within the bucket (default: 'products')
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    try:
        # Debug info
        print(f"Supabase URL: {SUPABASE_URL}")
        print(f"Storage bucket: {STORAGE_BUCKET}")
        print(f"File name: {file.filename}")
        print(f"Content type: {file.content_type}")
        print(f"Enhance with AI: {enhance}")
        
        # Read file content
        file_content = await file.read()
        print(f"File content length: {len(file_content)} bytes")
        
        # If enhance is requested, process the image with OpenAI's GPT-4 Vision
        if enhance and file.content_type.startswith('image/'):
            try:
                print("Starting AI image enhancement...")
                enhanced_content = await enhance_image_with_ai(file_content, file.content_type)
                if enhanced_content:
                    file_content = enhanced_content
                    print("Image successfully enhanced with AI")
            except Exception as e:
                print(f"Error enhancing image with AI: {str(e)}")
                # Continue with original image if enhancement fails
        
        # Generate a unique filename to avoid collisions
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        print(f"Generated unique filename: {unique_filename}")
        
        # Create the full path
        path = f"{folder}/{unique_filename}"
        print(f"Full storage path: {path}")
        
        # Upload to Supabase Storage
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
                "Content-Type": file.content_type
            }
            print(f"Headers prepared (auth token length: {len(SUPABASE_KEY) if SUPABASE_KEY else 0})")
            
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path}"
            print(f"Upload URL: {upload_url}")
            
            try:
                response = await client.post(
                    upload_url,
                    content=file_content,
                    headers=headers
                )
                print(f"Response status: {response.status_code}")
                print(f"Response body: {response.text}")
            except Exception as req_error:
                print(f"Request error: {str(req_error)}")
                raise HTTPException(status_code=500, detail=f"Request error: {str(req_error)}")
            
            if response.status_code != 200:
                print(f"Upload failed with status {response.status_code}: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to upload file: {response.text}"
                )
            
            # Generate the public URL
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path}"

            print(f"File uploaded successfully: {public_url}")
            
            return {
                "url": public_url,
                "path": path,
                "filename": unique_filename,
                "original_filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_content)
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.post("/upload-base64")
async def upload_base64_file(
    filename: str = Form(...),
    base64_data: str = Form(...),
    content_type: str = Form(...),
    folder: str = Form("products")
):
    """
    Upload a base64 encoded file to Supabase Storage and return the URL.
    
    - filename: Original filename
    - base64_data: Base64 encoded file content
    - content_type: MIME type of the file
    - folder: Optional folder path within the bucket (default: 'products')
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    try:
        # Decode base64 data
        # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        if "base64," in base64_data:
            base64_data = base64_data.split("base64,")[1]
        
        file_content = base64.b64decode(base64_data)
        
        # Get file extension from content type or filename
        file_ext = os.path.splitext(filename)[1]
        if not file_ext and content_type:
            ext = mimetypes.guess_extension(content_type)
            if ext:
                file_ext = ext
        
        # Generate a unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Create the full path
        path = f"{folder}/{unique_filename}"
        
        # Upload to Supabase Storage
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
                "Content-Type": content_type
            }
            
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path}"
            response = await client.post(
                upload_url,
                content=file_content,
                headers=headers
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to upload file: {response.text}"
                )
            
            # Generate the public URL
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path}"
            
            return {
                "url": public_url,
                "path": path,
                "filename": unique_filename,
                "original_filename": filename,
                "content_type": content_type,
                "size": len(file_content)
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

async def enhance_image_with_ai(image_content: bytes, content_type: str) -> bytes:
    """
    Enhance an image using OpenAI's GPT-image-1 model.
    
    - Removes background
    - Improves image quality
    - Returns the enhanced image as bytes
    """
    try:
        # Convert bytes to base64 for OpenAI API
        base64_image = base64.b64encode(image_content).decode('utf-8')
        
        # Call OpenAI API to get enhanced image using the image generation API
        response = openai.Image.create(
            model="gpt-image-1",
            prompt="Enhance this product image by removing the background completely. Make it transparent or clean white and improve the overall quality.",
            n=1,  # Generate one image
            size="1024x1024",
            response_format="b64_json",  # Get base64 encoded image back
            image=base64_image  # Pass the base64 encoded image
        )
        
        # Extract the base64 image data from the response
        if 'data' in response and len(response['data']) > 0 and 'b64_json' in response['data'][0]:
            # Get the base64 encoded image data
            enhanced_base64 = response['data'][0]['b64_json']
            
            # Convert base64 back to bytes
            enhanced_image_bytes = base64.b64decode(enhanced_base64)
            return enhanced_image_bytes
        
        # If we couldn't extract an image URL or download failed, return original
        return image_content
    except Exception as e:
        print(f"Error in AI image enhancement: {str(e)}")
        # Return original image if enhancement fails
        return image_content

@router.post("/enhance-image")
async def enhance_image(
    file: UploadFile = File(...),
):
    """
    Enhance an image using AI without uploading it to storage.
    Returns the enhanced image as a base64 string.
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        # Read file content
        file_content = await file.read()
        
        # Enhance the image
        enhanced_content = await enhance_image_with_ai(file_content, file.content_type)
        
        # Convert to base64 for response
        base64_enhanced = base64.b64encode(enhanced_content).decode('utf-8')
        
        return {
            "enhanced_image": f"data:{file.content_type};base64,{base64_enhanced}",
            "original_filename": file.filename,
            "content_type": file.content_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enhancing image: {str(e)}")

@router.delete("/{folder}/{filename}")
async def delete_file(
    folder: str,
    filename: str
):
    """
    Delete a file from Supabase Storage.
    
    - folder: Folder path within the bucket
    - filename: Name of the file to delete
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    try:
        path = f"{folder}/{filename}"
        
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY
            }
            
            delete_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path}"
            response = await client.delete(delete_url, headers=headers)
            
            if response.status_code not in (200, 404):  # 404 means already deleted
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to delete file: {response.text}"
                )
            
            return {"message": "File deleted successfully", "path": path}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")
