#!/usr/bin/env python3
"""
Test script to verify that required packages are properly installed and accessible.
"""

print("Testing imports...")

try:
    import qdrant_client
    print("✅ qdrant_client imported successfully")
except ImportError as e:
    print(f"❌ Failed to import qdrant_client: {e}")

try:
    from sentence_transformers import SentenceTransformer
    print("✅ sentence_transformers imported successfully")
except ImportError as e:
    print(f"❌ Failed to import sentence_transformers: {e}")

print("\nPython path information:")
import sys
print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")
print("\nPackage locations:")
try:
    import qdrant_client
    print(f"qdrant_client location: {qdrant_client.__file__}")
except ImportError:
    print("qdrant_client not found")

try:
    import sentence_transformers
    print(f"sentence_transformers location: {sentence_transformers.__file__}")
except ImportError:
    print("sentence_transformers not found")
