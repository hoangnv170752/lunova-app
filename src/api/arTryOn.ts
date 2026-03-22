/**
 * Lunova backend — AR jewelry try-on (OpenCV Haar + overlay).
 * Endpoints: GET /ar-tryon/presets, POST /ar-tryon/compose, POST /ar-tryon/compose/json
 */

const getBaseUrl = () => import.meta.env.VITE_BACKEND_URL || "https://lunova-api.onrender.com";

export type ArJewelleryPreset = {
  file: string;
  name: string;
  price: string;
  color: string;
  gem: string;
  x: number;
  y: number;
  dw: number;
  dh: number;
  drop_factor: number;
  use_face_height: boolean;
};

export type ArTryOnPresetsResponse = {
  presets: Record<string, ArJewelleryPreset>;
  config_path: string;
  detector: string;
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

export type ArComposeFaceBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ArComposeMeta = {
  detector: string;
  face_count: number;
  used_face_index: number | null;
  face_box: ArComposeFaceBox | null;
  no_face_detected: boolean;
  detection_reason: string | null;
  output_width: number;
  output_height: number;
  output_format: string;
  returned_original: boolean;
  selected_jewellery_id: string | null;
  used_custom_overlay: boolean;
  flip_horizontal: boolean;
  placement: {
    x: number;
    y: number;
    dw: number;
    dh: number;
    drop_factor: number;
    use_face_height: boolean;
  };
};

type ComposeArTryOnJsonResponse = {
  image_base64: string;
  mime_type: string;
  meta: ArComposeMeta;
};

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function parseComposeJsonResponse(res: Response): Promise<{ blob: Blob; meta: ArComposeMeta }> {
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

  const body = (await res.json()) as ComposeArTryOnJsonResponse;
  return {
    blob: base64ToBlob(body.image_base64, body.mime_type),
    meta: body.meta,
  };
}

/**
 * Debug/custom-overlay compose path. Built-in items should use composeArTryOn with jewellery_id.
 */
export async function composeArTryOnWithOverlay(
  imageBlob: Blob,
  overlayBlob: Blob,
  overlayParams: OverlayParams,
  options: ComposeArTryOnOptions = {}
): Promise<{ blob: Blob; meta: ArComposeMeta }> {
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

  const res = await fetch(`${base}/ar-tryon/compose/json`, {
    method: 'POST',
    body: form,
  });

  return parseComposeJsonResponse(res);
}

/**
 * Built-in compose path using backend-managed jewellery presets and debug metadata.
 */
export async function composeArTryOn(
  imageBlob: Blob,
  jewelleryId: string,
  options: ComposeArTryOnOptions = {}
): Promise<{ blob: Blob; meta: ArComposeMeta }> {
  const base = getBaseUrl().replace(/\/$/, '');
  const form = new FormData();
  form.append('image', imageBlob, 'capture.jpg');
  form.append('jewellery_id', jewelleryId);
  form.append('flip_horizontal', String(options.flip_horizontal ?? true));
  form.append('return_original_if_no_face', String(options.return_original_if_no_face ?? false));
  form.append('width', String(options.width ?? 720));
  form.append('height', String(options.height ?? 640));
  form.append('output_format', options.output_format ?? 'png');

  const res = await fetch(`${base}/ar-tryon/compose/json`, {
    method: 'POST',
    body: form,
  });

  return parseComposeJsonResponse(res);
}
