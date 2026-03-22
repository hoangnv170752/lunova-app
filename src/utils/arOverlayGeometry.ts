/**
 * Map jewellery overlay from video pixel space → CSS position over a letterboxed <video>.
 * Same placement as the backend: center under the face, then offset with margins/drop.
 */

import type { CSSProperties } from 'react';

/** Letterboxed video content area inside the video element (object-contain). */
export function getVideoContentRect(video: HTMLVideoElement): {
  ox: number;
  oy: number;
  drawW: number;
  drawH: number;
} {
  const cw = video.clientWidth;
  const ch = video.clientHeight;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || !cw || !ch) {
    return { ox: 0, oy: 0, drawW: cw, drawH: ch };
  }
  const vr = vw / vh;
  const cr = cw / ch;
  if (vr > cr) {
    const drawW = cw;
    const drawH = cw / vr;
    return { ox: 0, oy: (ch - drawH) / 2, drawW, drawH };
  }
  const drawH = ch;
  const drawW = ch * vr;
  return { ox: (cw - drawW) / 2, oy: 0, drawW, drawH };
}

export type FaceBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Face tilt angle in degrees (computed from eye positions). */
  angle?: number;
};

export type JewelleryPlacementOptions = {
  /**
   * Extra drop below chin as a fraction of face height (e.g. 0.15 = 15% of face h).
   * Helps sit necklaces on the neck, not on the chin.
   */
  dropFactor?: number;
  /**
   * If true, scale overlay using face height instead of width (better for necklaces / tall assets).
   */
  useFaceHeightForScale?: boolean;
};

export function mapJewelleryOverlayStyle(
  video: HTMLVideoElement,
  face: FaceBox,
  marginX: number,
  marginY: number,
  scaleW: number,
  scaleH: number,
  mirror: boolean,
  placement: JewelleryPlacementOptions = {}
): CSSProperties {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const drop = placement.dropFactor ?? 0;
  const ref = placement.useFaceHeightForScale ? face.h : face.w;
  const fw = ref * scaleW;
  const fh = ref * scaleH;

  // Center horizontally on face; anchor at chin then center overlay vertically
  const topXVid = face.x + (face.w - fw) / 2 + marginX;
  // Anchor at chin (bottom of face) + margin + drop, pull back 50% of overlay height
  // so the overlay is centered at the necklace anchor (collarbone level)
  const topYVid = face.y + face.h + marginY + drop * face.h - 0.5 * fh;

  let leftVid = topXVid;
  if (mirror) {
    leftVid = vw - topXVid - fw;
  }

  const { ox, oy, drawW, drawH } = getVideoContentRect(video);
  // Scale factors accounting for letterbox padding and aspect ratio stretch
  const sx = drawW / vw;
  const sy = drawH / vh;

  // Face tilt: negate when mirrored (horizontal flip inverts rotation direction)
  const rawAngle = face.angle ?? 0;
  const displayAngle = mirror ? -rawAngle : rawAngle;

  return {
    position: 'absolute',
    left: Math.round(ox + leftVid * sx),
    top: Math.round(oy + topYVid * sy),
    width: Math.round(fw * sx),
    height: Math.round(fh * sy),
    pointerEvents: 'none',
    zIndex: 10,
    transform: displayAngle ? `rotate(${displayAngle.toFixed(1)}deg)` : undefined,
    transformOrigin: 'top center',
  };
}
