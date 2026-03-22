from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional, Tuple

import cv2
import numpy as np

# Paths relative to blazingfast-api package root (parent of services/)
_BASE = Path(__file__).resolve().parent.parent
CASCADE_PATH = _BASE / "models" / "haarcascade_frontalface_default.xml"
JEWELLERY_JSON = _BASE / "assets" / "jewellery" / "jewellery.json"

# Default output size (matches ARJewelBox main.py)
DEFAULT_WIDTH = 720
DEFAULT_HEIGHT = 640

_cascade: Optional[cv2.CascadeClassifier] = None


def get_cascade() -> cv2.CascadeClassifier:
    global _cascade
    if _cascade is None:
        if not CASCADE_PATH.is_file():
            raise FileNotFoundError(f"Haar cascade not found: {CASCADE_PATH}")
        _cascade = cv2.CascadeClassifier(str(CASCADE_PATH))
    return _cascade


def load_jewellery_presets() -> dict[str, Any]:
    """Load jewellery.json (paths are relative to _BASE)."""
    if not JEWELLERY_JSON.is_file():
        return {}
    with open(JEWELLERY_JSON, encoding="utf-8") as f:
        return json.load(f)


def resolve_jewellery_path(relative_path: str) -> Path:
    return (_BASE / relative_path).resolve()


def load_overlay_bgra(path: Path) -> np.ndarray:
    """Load PNG with alpha channel (BGRA)."""
    if not path.is_file():
        raise FileNotFoundError(f"Overlay image not found: {path}")
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"Could not decode image: {path}")
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGRA)
    elif img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    return img


def overlay_bgra_on_frame(
    frame_bgra: np.ndarray,
    overlay_bgra: np.ndarray,
    top_left_x: int,
    top_left_y: int,
) -> None:
    """
    Copy non-transparent pixels from overlay onto frame (same logic as ARJewelBox loop,
    implemented with numpy for clarity and bounds clipping).
    """
    h_f, w_f = frame_bgra.shape[:2]
    ih, iw = overlay_bgra.shape[:2]
    y0, x0 = top_left_y, top_left_x
    y1, x1 = y0 + ih, x0 + iw
    # Intersection with frame
    fy0, fx0 = max(0, y0), max(0, x0)
    fy1, fx1 = min(h_f, y1), min(w_f, x1)
    if fy0 >= fy1 or fx0 >= fx1:
        return
    oy0, ox0 = fy0 - y0, fx0 - x0
    sub_o = overlay_bgra[oy0 : oy0 + (fy1 - fy0), ox0 : ox0 + (fx1 - fx0)]
    sub_f = frame_bgra[fy0:fy1, fx0:fx1]
    mask = sub_o[:, :, 3] > 0
    sub_f[mask] = sub_o[mask]


def apply_ar_jewelry_to_frame(
    frame_bgr: np.ndarray,
    overlay_bgra: np.ndarray,
    mx: int,
    my: int,
    dw: float,
    dh: float,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    flip_horizontal: bool = False,
    scale_factor: float = 1.8,
    min_neighbors: int = 3,
    use_first_face_if_multiple: bool = True,
) -> Tuple[np.ndarray, dict[str, Any]]:
    """
    Detect face, resize frame, overlay jewellery (ARJewelBox algorithm).

    Returns (output_bgra_or_bgr, meta) where meta has face_count, used_face_index.
    """
    meta: dict[str, Any] = {"face_count": 0, "used_face_index": None}

    if flip_horizontal:
        frame_bgr = cv2.flip(frame_bgr, 1)

    frame_bgr = cv2.resize(frame_bgr, (width, height))
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    cascade = get_cascade()
    faces = cascade.detectMultiScale(gray, scaleFactor=scale_factor, minNeighbors=min_neighbors)

    meta["face_count"] = int(len(faces))
    if len(faces) == 0:
        # Return original resized frame as BGR (no overlay)
        return frame_bgr, meta

    if len(faces) > 1 and not use_first_face_if_multiple:
        return frame_bgr, meta

    x, y, w, h = faces[0]
    meta["used_face_index"] = 0

    frame_bgra = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2BGRA)
    fw, fh = int(w * dw), int(w * dh)
    if fw < 1 or fh < 1:
        return frame_bgra, meta

    new_impose = cv2.resize(overlay_bgra, (fw, fh))
    # ARJewelBox: top-left at (x + mx, y + h + my)
    top_x = x + mx
    top_y = y + h + my
    overlay_bgra_on_frame(frame_bgra, new_impose, top_x, top_y)
    return frame_bgra, meta


def compose_from_bytes(
    image_bytes: bytes,
    overlay_bgra: np.ndarray,
    mx: int,
    my: int,
    dw: float,
    dh: float,
    *,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    output_format: str = "png",
    flip_horizontal: bool = False,
) -> Tuple[bytes, dict[str, Any]]:
    """
    Decode image bytes, run AR overlay, encode to PNG or JPEG bytes.

    Raises ValueError if no face detected (face_count == 0).
    """
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Could not decode input image")

    out, meta = apply_ar_jewelry_to_frame(
        frame,
        overlay_bgra,
        mx,
        my,
        dw,
        dh,
        width=width,
        height=height,
        flip_horizontal=flip_horizontal,
    )

    if meta["face_count"] == 0:
        raise ValueError("No face detected in the image")

    ext = ".png" if output_format.lower() == "png" else ".jpg"
    ok, buf = cv2.imencode(ext, out)
    if not ok:
        raise RuntimeError("Failed to encode output image")
    return buf.tobytes(), meta
