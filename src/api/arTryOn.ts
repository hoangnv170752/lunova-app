/**
 * Lunova backend — AR jewelry try-on (OpenCV Haar + overlay).
 * Endpoints: GET /ar-tryon/presets, POST /ar-tryon/compose
 */

const getBaseUrl = () => import.meta.env.VITE_BACKEND_URL || "https://lunova-api.onrender.com";

export type ArJewelleryPreset = {
  x: number;
  y: number;
  dw: number;
  dh: number;
};

export type ArTryOnPresetsResponse = {
  presets: Record<string, ArJewelleryPreset>;
  config_path: string;
};

export async function fetchArTryOnPresets(): Promise<ArTryOnPresetsResponse> {
  const base = getBaseUrl().replace(/\/$/, '');
  const res = await fetch(`${base}/ar-tryon/presets`);
  if (!res.ok) {
    throw new Error(`Failed to load AR presets (${res.status})`);
  }
  return res.json();
}

export type ComposeArTryOnOptions = {
  /** Mirror image before detection (typical for front camera / mirrored preview). Default true. */
  flip_horizontal?: boolean;
  /** If backend finds no face, return resized photo instead of error. Default false. */
  return_original_if_no_face?: boolean;
  width?: number;
  height?: number;
  output_format?: 'png' | 'jpg';
};

export type OverlayParams = {
  margin_x: number;
  margin_y: number;
  scale_w: number;
  scale_h: number;
  /** 0–0.5 typical; extra offset below chin = drop_factor * face_height */
  drop_factor?: number;
  use_face_height?: boolean;
};

/**
 * Same as /ar-tryon/compose but sends overlay PNG from the client (e.g. src/assets/jewellery).
 * Backend uses margin_x, margin_y, scale_w, scale_h from your local config.
 */
export async function composeArTryOnWithOverlay(
  imageBlob: Blob,
  overlayBlob: Blob,
  overlayParams: OverlayParams,
  options: ComposeArTryOnOptions = {}
): Promise<{ blob: Blob; faceCount: string | null }> {
  const base = getBaseUrl().replace(/\/$/, '');
  const form = new FormData();
  form.append('image', imageBlob, 'capture.jpg');
  form.append('overlay', overlayBlob, 'overlay.png');
  form.append('margin_x', String(overlayParams.margin_x));
  form.append('margin_y', String(overlayParams.margin_y));
  form.append('scale_w', String(overlayParams.scale_w));
  form.append('scale_h', String(overlayParams.scale_h));
  form.append('drop_factor', String(overlayParams.drop_factor ?? 0));
  form.append('use_face_height', String(overlayParams.use_face_height ?? false));
  form.append('flip_horizontal', String(options.flip_horizontal ?? true));
  form.append('return_original_if_no_face', String(options.return_original_if_no_face ?? false));
  form.append('width', String(options.width ?? 720));
  form.append('height', String(options.height ?? 640));
  form.append('output_format', options.output_format ?? 'png');

  const res = await fetch(`${base}/ar-tryon/compose`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const blob = await res.blob();
  const faceCount = res.headers.get('X-AR-Face-Count');
  return { blob, faceCount };
}

/**
 * Send a photo and preset id; returns composed image blob (PNG or JPEG).
 */
export async function composeArTryOn(
  imageBlob: Blob,
  jewelleryId: string,
  options: ComposeArTryOnOptions = {}
): Promise<{ blob: Blob; faceCount: string | null }> {
  const base = getBaseUrl().replace(/\/$/, '');
  const form = new FormData();
  form.append('image', imageBlob, 'capture.jpg');
  form.append('jewellery_id', jewelleryId);
  form.append('flip_horizontal', String(options.flip_horizontal ?? true));
  form.append('return_original_if_no_face', String(options.return_original_if_no_face ?? false));
  form.append('width', String(options.width ?? 720));
  form.append('height', String(options.height ?? 640));
  form.append('output_format', options.output_format ?? 'png');

  const res = await fetch(`${base}/ar-tryon/compose`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const blob = await res.blob();
  const faceCount = res.headers.get('X-AR-Face-Count');
  return { blob, faceCount };
}
