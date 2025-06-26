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
    folder: str = Form("products")  # Default folder inside the bucket
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
        
        # Read file content
        file_content = await file.read()
        print(f"File content length: {len(file_content)} bytes")
        
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
