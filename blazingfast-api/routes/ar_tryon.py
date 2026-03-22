"""
AR jewelry try-on endpoints (OpenCV Haar cascade + overlay PNG).
"""

from __future__ import annotations

import base64
from typing import Any, Optional

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from services.ar_jewelry import (
    DETECTOR_NAME,
    JEWELLERY_JSON,
    compose_from_bytes,
    load_jewellery_presets,
    load_overlay_bgra,
    resolve_jewellery_path,
    serialize_preset_for_api,
)

router = APIRouter(prefix="/ar-tryon", tags=["ar-tryon"])


async def _resolve_overlay(
    jewellery_id: Optional[str],
    overlay: Optional[UploadFile],
    margin_x: Optional[int],
    margin_y: Optional[int],
    scale_w: Optional[float],
    scale_h: Optional[float],
) -> dict[str, Any]:
    """
    Resolve either a built-in preset or a custom overlay upload.

    The returned dict contains overlay_bgra, placement, selected_jewellery_id, and used_custom_overlay.
    """
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
        return {
            "overlay_bgra": overlay_bgra,
            "placement": {
                "x": mx,
                "y": my,
                "dw": dw,
                "dh": dh,
                "drop_factor": 0.0,
                "use_face_height": False,
            },
            "selected_jewellery_id": None,
            "used_custom_overlay": True,
        }

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
    drop = float(cfg.get("drop_factor", 0) or 0)
    ufh = bool(cfg.get("use_face_height", False))
    return {
        "overlay_bgra": overlay_bgra,
        "placement": {
            "x": mx,
            "y": my,
            "dw": dw,
            "dh": dh,
            "drop_factor": drop,
            "use_face_height": ufh,
        },
        "selected_jewellery_id": jid,
        "used_custom_overlay": False,
    }


def _finalize_meta(
    meta: dict[str, Any],
    *,
    selected_jewellery_id: Optional[str],
    used_custom_overlay: bool,
    placement: dict[str, Any],
    flip_horizontal: bool,
) -> dict[str, Any]:
    meta["selected_jewellery_id"] = selected_jewellery_id
    meta["used_custom_overlay"] = used_custom_overlay
    meta["placement"] = placement
    meta["flip_horizontal"] = flip_horizontal
    return meta


def _build_response_headers(meta: dict[str, Any]) -> dict[str, str]:
    return {
        "X-AR-Face-Count": str(meta.get("face_count", "")),
        "X-AR-Used-Face-Index": "" if meta.get("used_face_index") is None else str(meta["used_face_index"]),
        "X-AR-Detector": str(meta.get("detector", DETECTOR_NAME)),
        "X-AR-No-Face": str(bool(meta.get("no_face_detected", False))).lower(),
        "X-AR-Returned-Original": str(bool(meta.get("returned_original", False))).lower(),
        "X-AR-Detection-Reason": str(meta.get("detection_reason") or ""),
        "X-AR-Selected-Jewellery-Id": str(meta.get("selected_jewellery_id") or ""),
        "X-AR-Used-Custom-Overlay": str(bool(meta.get("used_custom_overlay", False))).lower(),
        "X-AR-Output-Width": str(meta.get("output_width", "")),
        "X-AR-Output-Height": str(meta.get("output_height", "")),
    }


@router.get("/presets")
def list_jewellery_presets() -> dict[str, Any]:
    """List built-in jewellery presets and display metadata without exposing backend file paths."""
    raw = load_jewellery_presets()
    out: dict[str, dict[str, Any]] = {}
    for key, cfg in raw.items():
        out[key] = serialize_preset_for_api(cfg)
    return {"presets": out, "config_path": str(JEWELLERY_JSON), "detector": DETECTOR_NAME}


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
    detect_scale_factor: Optional[float] = Form(
        None,
        description="Optional OpenCV Haar scaleFactor (e.g. 1.1). Leave empty for auto multi-pass.",
    ),
    detect_min_neighbors: Optional[int] = Form(
        None,
        ge=1,
        le=10,
        description="Optional minNeighbors for Haar. Use with detect_scale_factor.",
    ),
    drop_factor: float = Form(
        0.0,
        ge=0.0,
        le=0.6,
        description="Push overlay down by this fraction of face height (necklaces on neck).",
    ),
    use_face_height: bool = Form(
        False,
        description="Scale dw/dh against face height instead of width.",
    ),
) -> Response:
    """
    Apply virtual jewellery overlay using Haar frontal face detection (ARJewelBox-style).

    Provide either `jewellery_id` (preset) or upload `overlay` PNG. If both are given, `overlay` wins.
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    overlay_config = await _resolve_overlay(
        jewellery_id, overlay, margin_x, margin_y, scale_w, scale_h
    )
    placement = overlay_config["placement"]
    d_drop = drop_factor if overlay_config["used_custom_overlay"] else float(placement["drop_factor"])
    d_ufh = use_face_height if overlay_config["used_custom_overlay"] else bool(placement["use_face_height"])
    placement["drop_factor"] = d_drop
    placement["use_face_height"] = d_ufh

    try:
        out_bytes, meta = compose_from_bytes(
            image_bytes,
            overlay_config["overlay_bgra"],
            placement["x"],
            placement["y"],
            placement["dw"],
            placement["dh"],
            width=width,
            height=height,
            output_format=output_format,
            flip_horizontal=flip_horizontal,
            detect_scale_factor=detect_scale_factor,
            detect_min_neighbors=detect_min_neighbors,
            drop_factor=d_drop,
            use_face_height=d_ufh,
            allow_no_face=return_original_if_no_face,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    meta = _finalize_meta(
        meta,
        selected_jewellery_id=overlay_config["selected_jewellery_id"],
        used_custom_overlay=overlay_config["used_custom_overlay"],
        placement=placement,
        flip_horizontal=flip_horizontal,
    )
    media = "image/png" if output_format.lower() == "png" else "image/jpeg"
    headers = _build_response_headers(meta)
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
    return_original_if_no_face: bool = Form(False),
    detect_scale_factor: Optional[float] = Form(None),
    detect_min_neighbors: Optional[int] = Form(None, ge=1, le=10),
    drop_factor: float = Form(0.0, ge=0.0, le=0.6),
    use_face_height: bool = Form(False),
) -> dict[str, Any]:
    """Same as /compose but returns JSON with base64 image."""
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    overlay_config = await _resolve_overlay(
        jewellery_id, overlay, margin_x, margin_y, scale_w, scale_h
    )
    placement = overlay_config["placement"]
    d_drop = drop_factor if overlay_config["used_custom_overlay"] else float(placement["drop_factor"])
    d_ufh = use_face_height if overlay_config["used_custom_overlay"] else bool(placement["use_face_height"])
    placement["drop_factor"] = d_drop
    placement["use_face_height"] = d_ufh

    try:
        out_bytes, meta = compose_from_bytes(
            image_bytes,
            overlay_config["overlay_bgra"],
            placement["x"],
            placement["y"],
            placement["dw"],
            placement["dh"],
            width=width,
            height=height,
            output_format=output_format,
            flip_horizontal=flip_horizontal,
            detect_scale_factor=detect_scale_factor,
            detect_min_neighbors=detect_min_neighbors,
            drop_factor=d_drop,
            use_face_height=d_ufh,
            allow_no_face=return_original_if_no_face,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    meta = _finalize_meta(
        meta,
        selected_jewellery_id=overlay_config["selected_jewellery_id"],
        used_custom_overlay=overlay_config["used_custom_overlay"],
        placement=placement,
        flip_horizontal=flip_horizontal,
    )
    mime = "image/png" if output_format.lower() == "png" else "image/jpeg"
    return {
        "image_base64": base64.b64encode(out_bytes).decode("ascii"),
        "mime_type": mime,
        "meta": meta,
    }
