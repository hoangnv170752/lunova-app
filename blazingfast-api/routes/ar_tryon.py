"""
AR jewelry try-on endpoints (OpenCV Haar cascade + overlay PNG).
"""

from __future__ import annotations

import base64
from typing import Any, Optional, Tuple

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from services.ar_jewelry import (
    JEWELLERY_JSON,
    compose_from_bytes,
    load_jewellery_presets,
    load_overlay_bgra,
    resolve_jewellery_path,
)

router = APIRouter(prefix="/ar-tryon", tags=["ar-tryon"])


async def _resolve_overlay(
    jewellery_id: Optional[str],
    overlay: Optional[UploadFile],
    margin_x: Optional[int],
    margin_y: Optional[int],
    scale_w: Optional[float],
    scale_h: Optional[float],
) -> Tuple[np.ndarray, int, int, float, float]:
    """Load overlay BGRA and margins/scales from preset or uploaded file."""
    if overlay is not None and overlay.filename:
        obytes = await overlay.read()
        overlay_bgra = cv2.imdecode(np.frombuffer(obytes, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
        if overlay_bgra is None:
            raise HTTPException(status_code=400, detail="Could not decode overlay image")
        if overlay_bgra.ndim == 2:
            overlay_bgra = cv2.cvtColor(overlay_bgra, cv2.COLOR_GRAY2BGRA)
        elif overlay_bgra.shape[2] == 3:
            overlay_bgra = cv2.cvtColor(overlay_bgra, cv2.COLOR_BGR2BGRA)
        mx = int(margin_x if margin_x is not None else 0)
        my = int(margin_y if margin_y is not None else 0)
        dw = float(scale_w if scale_w is not None else 1.0)
        dh = float(scale_h if scale_h is not None else 1.0)
        return overlay_bgra, mx, my, dw, dh

    presets = load_jewellery_presets()
    jid = jewellery_id or (next(iter(presets.keys())) if presets else None)
    if not jid or jid not in presets:
        raise HTTPException(
            status_code=400,
            detail="Provide `jewellery_id` (see /ar-tryon/presets) or upload `overlay` PNG",
        )
    cfg = presets[jid]
    path = resolve_jewellery_path(cfg["path"])
    overlay_bgra = load_overlay_bgra(path)
    mx = int(margin_x if margin_x is not None else cfg.get("x", 0))
    my = int(margin_y if margin_y is not None else cfg.get("y", 0))
    dw = float(scale_w if scale_w is not None else cfg.get("dw", 1.0))
    dh = float(scale_h if scale_h is not None else cfg.get("dh", 1.0))
    return overlay_bgra, mx, my, dw, dh


@router.get("/presets")
def list_jewellery_presets() -> dict[str, Any]:
    """List built-in jewellery keys and their margin/scale parameters (no file paths in response)."""
    raw = load_jewellery_presets()
    out: dict[str, dict[str, Any]] = {}
    for key, cfg in raw.items():
        out[key] = {
            "x": cfg.get("x", 0),
            "y": cfg.get("y", 0),
            "dw": cfg.get("dw", 1.0),
            "dh": cfg.get("dh", 1.0),
        }
    return {"presets": out, "config_path": str(JEWELLERY_JSON)}


@router.post("/compose")
async def compose_ar_tryon(
    image: UploadFile = File(..., description="User photo (JPEG/PNG)"),
    jewellery_id: Optional[str] = Form(
        None,
        description="Preset id from /ar-tryon/presets (e.g. jewel1). Ignored if overlay is uploaded.",
    ),
    overlay: Optional[UploadFile] = File(None, description="Optional custom PNG overlay with transparency"),
    margin_x: Optional[int] = Form(None),
    margin_y: Optional[int] = Form(None),
    scale_w: Optional[float] = Form(None),
    scale_h: Optional[float] = Form(None),
    width: int = Form(720, ge=320, le=1920),
    height: int = Form(640, ge=240, le=1080),
    flip_horizontal: bool = Form(False),
    output_format: str = Form("png"),
    return_original_if_no_face: bool = Form(False),
) -> Response:
    """
    Apply virtual jewellery overlay using Haar frontal face detection (ARJewelBox-style).

    Provide either `jewellery_id` (preset) or upload `overlay` PNG. If both are given, `overlay` wins.
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    overlay_bgra, mx, my, dw, dh = await _resolve_overlay(
        jewellery_id, overlay, margin_x, margin_y, scale_w, scale_h
    )

    try:
        out_bytes, meta = compose_from_bytes(
            image_bytes,
            overlay_bgra,
            mx,
            my,
            dw,
            dh,
            width=width,
            height=height,
            output_format=output_format,
            flip_horizontal=flip_horizontal,
        )
    except ValueError as e:
        if "No face detected" in str(e) and return_original_if_no_face:
            arr = np.frombuffer(image_bytes, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is None:
                raise HTTPException(status_code=400, detail="Could not decode input image") from e
            frame = cv2.resize(frame, (width, height))
            ext = ".png" if output_format.lower() == "png" else ".jpg"
            ok, buf = cv2.imencode(ext, frame)
            if not ok:
                raise HTTPException(status_code=500, detail="Encode failed") from e
            media = "image/png" if ext == ".png" else "image/jpeg"
            return Response(content=buf.tobytes(), media_type=media)
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    media = "image/png" if output_format.lower() == "png" else "image/jpeg"
    headers = {
        "X-AR-Face-Count": str(meta.get("face_count", "")),
        "X-AR-Used-Face-Index": str(meta.get("used_face_index", "")),
    }
    return Response(content=out_bytes, media_type=media, headers=headers)


@router.post("/compose/json")
async def compose_ar_tryon_json(
    image: UploadFile = File(...),
    jewellery_id: Optional[str] = Form(None),
    overlay: Optional[UploadFile] = File(None),
    margin_x: Optional[int] = Form(None),
    margin_y: Optional[int] = Form(None),
    scale_w: Optional[float] = Form(None),
    scale_h: Optional[float] = Form(None),
    width: int = Form(720),
    height: int = Form(640),
    flip_horizontal: bool = Form(False),
    output_format: str = Form("png"),
) -> dict[str, Any]:
    """Same as /compose but returns JSON with base64 image."""
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    overlay_bgra, mx, my, dw, dh = await _resolve_overlay(
        jewellery_id, overlay, margin_x, margin_y, scale_w, scale_h
    )

    try:
        out_bytes, meta = compose_from_bytes(
            image_bytes,
            overlay_bgra,
            mx,
            my,
            dw,
            dh,
            width=width,
            height=height,
            output_format=output_format,
            flip_horizontal=flip_horizontal,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    mime = "image/png" if output_format.lower() == "png" else "image/jpeg"
    return {
        "image_base64": base64.b64encode(out_bytes).decode("ascii"),
        "mime_type": mime,
        "meta": meta,
    }
