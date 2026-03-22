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


def _detect_face_haar(
    gray: np.ndarray,
    cascade: cv2.CascadeClassifier,
    *,
    scale_factor: Optional[float] = None,
    min_neighbors: Optional[int] = None,
) -> Optional[Tuple[int, int, int, int]]:
    """
    Run Haar frontal-face cascade (haarcascade_frontalface_default.xml).

    OpenCV loads the XML once into CascadeClassifier; each call to detectMultiScale
    scans the grayscale image at multiple scales and returns rectangles (x, y, w, h).

    If scale_factor / min_neighbors are omitted, uses several passes from strict → loose
    and returns the **largest** face (by area) found — reduces "no face" on webcams.
    """
    if scale_factor is not None and min_neighbors is not None:
        faces = cascade.detectMultiScale(
            gray,
            scaleFactor=float(scale_factor),
            minNeighbors=int(min_neighbors),
            minSize=(30, 30),
        )
        if len(faces) == 0:
            return None
        return max(((int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces), key=lambda r: r[2] * r[3])

    passes: list[Tuple[float, int, Tuple[int, int]]] = [
        (1.05, 4, (50, 50)),
        (1.1, 3, (40, 40)),
        (1.15, 2, (30, 30)),
        (1.3, 2, (25, 25)),
        (1.8, 3, (20, 20)),  # ARJewelBox-style
    ]
    best: Optional[Tuple[int, int, int, int]] = None
    best_area = 0
    for sf, mn, min_sz in passes:
        faces = cascade.detectMultiScale(gray, scaleFactor=sf, minNeighbors=mn, minSize=min_sz)
        for (x, y, w, h) in faces:
            area = w * h
            if area > best_area:
                best_area = area
                best = (int(x), int(y), int(w), int(h))
    if best is not None:
        return best

    # Low light: try CLAHE on grayscale, then one sensitive pass
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_eq = clahe.apply(gray)
    faces = cascade.detectMultiScale(gray_eq, scaleFactor=1.05, minNeighbors=2, minSize=(25, 25))
    if len(faces) == 0:
        return None
    return max(((int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces), key=lambda r: r[2] * r[3])


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
    detect_scale_factor: Optional[float] = None,
    detect_min_neighbors: Optional[int] = None,
    drop_factor: float = 0.0,
    use_face_height: bool = False,
) -> Tuple[np.ndarray, dict[str, Any]]:
    """
    Detect face (Haar cascade XML), resize frame, overlay jewellery (ARJewelBox-style).

    Model file: models/haarcascade_frontalface_default.xml (OpenCV Haar cascade).

    drop_factor: push overlay down by drop_factor * face_height (necklaces).
    use_face_height: if True, scale overlay using face height instead of width.

    Returns (output_bgra_or_bgr, meta) where meta has face_count, used_face_index.
    """
    meta: dict[str, Any] = {"face_count": 0, "used_face_index": None}

    if flip_horizontal:
        frame_bgr = cv2.flip(frame_bgr, 1)

    frame_bgr = cv2.resize(frame_bgr, (width, height))
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    cascade = get_cascade()
    face = _detect_face_haar(
        gray,
        cascade,
        scale_factor=detect_scale_factor,
        min_neighbors=detect_min_neighbors,
    )

    if face is None:
        return frame_bgr, meta

    x, y, w, h = face
    meta["face_count"] = 1
    meta["used_face_index"] = 0

    frame_bgra = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2BGRA)
    # ref: face width (rings) or face height (necklaces) × dw/dh
    ref = float(h) if use_face_height else float(w)
    fw, fh = int(ref * dw), int(ref * dh)
    if fw < 1 or fh < 1:
        return frame_bgra, meta

    new_impose = cv2.resize(overlay_bgra, (fw, fh))
    # ARJewelBox + optional neck drop: top-left at (x + mx, y + h + my + drop*h)
    top_x = x + mx
    top_y = int(y + h + my + drop_factor * h)
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
    detect_scale_factor: Optional[float] = None,
    detect_min_neighbors: Optional[int] = None,
    drop_factor: float = 0.0,
    use_face_height: bool = False,
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
        detect_scale_factor=detect_scale_factor,
        detect_min_neighbors=detect_min_neighbors,
        drop_factor=drop_factor,
        use_face_height=use_face_height,
    )

    if meta["face_count"] == 0:
        raise ValueError("No face detected in the image")

    ext = ".png" if output_format.lower() == "png" else ".jpg"
    ok, buf = cv2.imencode(ext, out)
    if not ok:
        raise RuntimeError("Failed to encode output image")
    return buf.tobytes(), meta
