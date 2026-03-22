from __future__ import annotations

import json
import math
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
DETECTOR_NAME = "haar"

_cascade: Optional[cv2.CascadeClassifier] = None
_eye_cascade: Optional[cv2.CascadeClassifier] = None


def get_cascade() -> cv2.CascadeClassifier:
    global _cascade
    if _cascade is None:
        if not CASCADE_PATH.is_file():
            raise FileNotFoundError(f"Haar cascade not found: {CASCADE_PATH}")
        _cascade = cv2.CascadeClassifier(str(CASCADE_PATH))
    return _cascade


def get_eye_cascade() -> cv2.CascadeClassifier:
    """Load Haar eye cascade (ships with OpenCV)."""
    global _eye_cascade
    if _eye_cascade is None:
        eye_xml = cv2.data.haarcascades + "haarcascade_eye.xml"  # type: ignore[attr-defined]
        _eye_cascade = cv2.CascadeClassifier(eye_xml)
    return _eye_cascade


def load_jewellery_presets() -> dict[str, Any]:
    """Load jewellery.json (paths are relative to _BASE)."""
    if not JEWELLERY_JSON.is_file():
        return {}
    with open(JEWELLERY_JSON, encoding="utf-8") as f:
        return json.load(f)


def serialize_preset_for_api(cfg: dict[str, Any]) -> dict[str, Any]:
    """Return the frontend-facing preset shape without exposing backend file paths."""
    path = str(cfg.get("path", ""))
    file_name = str(cfg.get("file") or Path(path).name)
    return {
        "file": file_name,
        "name": str(cfg.get("name") or Path(file_name).stem.replace("_", " ").title()),
        "price": str(cfg.get("price") or ""),
        "color": str(cfg.get("color") or "#F5F5F5"),
        "gem": str(cfg.get("gem") or "#FDE68A"),
        "x": int(cfg.get("x", 0)),
        "y": int(cfg.get("y", 0)),
        "dw": float(cfg.get("dw", 1.0)),
        "dh": float(cfg.get("dh", 1.0)),
        "drop_factor": float(cfg.get("drop_factor", 0.0) or 0.0),
        "use_face_height": bool(cfg.get("use_face_height", False)),
    }


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

    CLAHE is applied upfront so every pass benefits from normalised contrast.
    """
    # Apply CLAHE upfront for consistent contrast (helps webcam / uneven lighting)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_eq = clahe.apply(gray)

    if scale_factor is not None and min_neighbors is not None:
        faces = cascade.detectMultiScale(
            gray_eq,
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
        faces = cascade.detectMultiScale(gray_eq, scaleFactor=sf, minNeighbors=mn, minSize=min_sz)
        for (x, y, w, h) in faces:
            area = w * h
            if area > best_area:
                best_area = area
                best = (int(x), int(y), int(w), int(h))
    if best is not None:
        return best

    # Last resort: try raw grayscale (without CLAHE) with a sensitive pass
    faces = cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=2, minSize=(25, 25))
    if len(faces) == 0:
        return None
    return max(((int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces), key=lambda r: r[2] * r[3])


# ---------------------------------------------------------------------------
# Eye detection + face angle helpers
# ---------------------------------------------------------------------------

def _detect_eyes_in_face(
    gray: np.ndarray,
    face_rect: Tuple[int, int, int, int],
) -> list[Tuple[int, int]]:
    """
    Detect eyes inside *face_rect* using the Haar eye cascade.

    Returns a list of eye‑centre (cx, cy) coordinates in full‑image space,
    sorted left‑to‑right. Returns an empty list when no eyes are found.
    """
    x, y, w, h = face_rect
    # Only look in the upper 60% of the face box (eyes are in the top half)
    roi = gray[y : y + int(h * 0.6), x : x + w]
    if roi.size == 0:
        return []
    eye_cascade = get_eye_cascade()
    eyes = eye_cascade.detectMultiScale(
        roi, scaleFactor=1.1, minNeighbors=5, minSize=(20, 20)
    )
    if len(eyes) < 2:
        return []
    # Pick two largest by area, then sort left‑to‑right
    eyes_sorted = sorted(eyes, key=lambda e: e[2] * e[3], reverse=True)[:2]
    centres = [(x + ex + ew // 2, y + ey + eh // 2) for (ex, ey, ew, eh) in eyes_sorted]
    centres.sort(key=lambda c: c[0])
    return centres


def _compute_face_angle(
    gray: np.ndarray,
    face_rect: Tuple[int, int, int, int],
) -> float:
    """
    Estimate face tilt in **degrees** from the detected eye positions.

    Returns 0.0 when eyes cannot be found (or angle is trivially small).
    """
    eyes = _detect_eyes_in_face(gray, face_rect)
    if len(eyes) < 2:
        return 0.0
    (lx, ly), (rx, ry) = eyes
    dx = rx - lx
    dy = ry - ly
    if abs(dx) < 1:
        return 0.0
    angle = math.degrees(math.atan2(dy, dx))
    # Ignore extremely small jitter (< 1°)
    return angle if abs(angle) >= 1.0 else 0.0


def _rotate_overlay_bgra(
    overlay: np.ndarray,
    angle_deg: float,
) -> Tuple[np.ndarray, int, int]:
    """
    Rotate a BGRA overlay image by *angle_deg* around its centre.

    Returns (rotated_image, offset_x, offset_y) where the offsets describe
    how much the bounding box grew so the caller can adjust placement.
    """
    h, w = overlay.shape[:2]
    cx, cy = w / 2, h / 2
    M = cv2.getRotationMatrix2D((cx, cy), angle_deg, 1.0)
    cos_a = abs(M[0, 0])
    sin_a = abs(M[0, 1])
    new_w = int(h * sin_a + w * cos_a)
    new_h = int(h * cos_a + w * sin_a)
    M[0, 2] += (new_w - w) / 2
    M[1, 2] += (new_h - h) / 2
    rotated = cv2.warpAffine(
        overlay,
        M,
        (new_w, new_h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )
    return rotated, (new_w - w) // 2, (new_h - h) // 2


# ---------------------------------------------------------------------------
# Overlay compositing
# ---------------------------------------------------------------------------

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

    Face detection runs on the **original resolution** image to avoid aspect-ratio
    distortion.  Detected coordinates are then mapped proportionally to the output size.

    drop_factor: push overlay down by drop_factor * face_height (necklaces).
    use_face_height: if True, scale overlay using face height instead of width.

    Returns (output_bgra_or_bgr, meta) where meta captures detection/debug info.
    """
    meta: dict[str, Any] = {
        "detector": DETECTOR_NAME,
        "face_count": 0,
        "used_face_index": None,
        "face_box": None,
        "no_face_detected": False,
        "detection_reason": None,
    }

    if flip_horizontal:
        frame_bgr = cv2.flip(frame_bgr, 1)

    # --- Detect face at ORIGINAL resolution (avoids aspect-ratio distortion) ---
    orig_h, orig_w = frame_bgr.shape[:2]
    gray_orig = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    cascade = get_cascade()
    face = _detect_face_haar(
        gray_orig,
        cascade,
        scale_factor=detect_scale_factor,
        min_neighbors=detect_min_neighbors,
    )

    # --- Resize to output dimensions ---
    frame_bgr = cv2.resize(frame_bgr, (width, height))

    if face is None:
        meta["no_face_detected"] = True
        meta["detection_reason"] = "No face detected in the image"
        return frame_bgr, meta

    # Map face coordinates from original resolution → output resolution
    sx = width / orig_w
    sy = height / orig_h
    ox, oy, ow, oh = face
    x = int(ox * sx)
    y = int(oy * sy)
    w = int(ow * sx)
    h = int(oh * sy)

    meta["face_count"] = 1
    meta["used_face_index"] = 0
    meta["face_box"] = {"x": x, "y": y, "w": w, "h": h}

    frame_bgra = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2BGRA)
    # ref: face width or face height, depending on the jewellery preset.
    ref = float(h) if use_face_height else float(w)
    fw, fh = int(ref * dw), int(ref * dh)
    if fw < 1 or fh < 1:
        return frame_bgra, meta

    new_impose = cv2.resize(overlay_bgra, (fw, fh))

    # --- Detect face angle from eyes and rotate overlay ---
    face_angle = _compute_face_angle(gray_orig, face)
    if abs(face_angle) >= 1.0:
        new_impose, off_x, off_y = _rotate_overlay_bgra(new_impose, -face_angle)
    else:
        off_x, off_y = 0, 0

    # Center jewellery under the detected face; 0.5 offset centres the overlay
    # at the collarbone anchor (matches frontend preview).
    top_x = int(x + ((w - fw) / 2.0) + mx) - off_x
    top_y = int(y + h + my + (drop_factor * h) - (0.5 * fh)) - off_y
    overlay_bgra_on_frame(frame_bgra, new_impose, top_x, top_y)
    return frame_bgra, meta


def _encode_output_image(image: np.ndarray, output_format: str) -> bytes:
    ext = ".png" if output_format.lower() == "png" else ".jpg"
    image_to_encode = image
    if ext == ".jpg" and image.ndim == 3 and image.shape[2] == 4:
        image_to_encode = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    ok, buf = cv2.imencode(ext, image_to_encode)
    if not ok:
        raise RuntimeError("Failed to encode output image")
    return buf.tobytes()


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
    allow_no_face: bool = False,
) -> Tuple[bytes, dict[str, Any]]:
    """
    Decode image bytes, run AR overlay, encode to PNG or JPEG bytes.

    Raises ValueError if no face detected and allow_no_face is False.
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

    meta["output_width"] = width
    meta["output_height"] = height
    meta["output_format"] = output_format.lower()
    meta["returned_original"] = False

    if meta["no_face_detected"]:
        if not allow_no_face:
            raise ValueError(str(meta["detection_reason"]))
        meta["returned_original"] = True

    return _encode_output_image(out, output_format), meta
