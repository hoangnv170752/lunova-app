import { useEffect, useRef, useState, type RefObject } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import type { FaceBox } from '../utils/arOverlayGeometry';

const MP_VERSION = '0.10.14';
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const BLAZE_FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite';

/** Proximity tolerance — suppress jittery state updates when face barely moved. */
function facesClose(a: FaceBox | null, b: FaceBox | null, eps = 12): boolean {
  if (a === null && b === null) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.w - b.w) < eps &&
    Math.abs(a.h - b.h) < eps
  );
}

/** MediaPipe keypoint — normalised (0-1) image coordinates. */
interface MPKeypoint {
  x: number;
  y: number;
  label?: string;
  score?: number;
}

/**
 * Compute face tilt (degrees) from eye positions.
 * MediaPipe FaceDetector keypoints:
 *   [0] right eye, [1] left eye, [2] nose, [3] mouth, [4] right ear, [5] left ear
 *
 * Returns 0 when keypoints are unavailable.
 */
function computeFaceAngle(keypoints: MPKeypoint[] | undefined): number {
  if (!keypoints || keypoints.length < 2) return 0;
  const rightEye = keypoints[0];
  const leftEye = keypoints[1];
  if (!rightEye || !leftEye) return 0;
  const dx = leftEye.x - rightEye.x;
  const dy = leftEye.y - rightEye.y;
  if (Math.abs(dx) < 0.001) return 0; // eyes at identical x → skip
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Validate that the face keypoints make geometric sense.
 * Rejects partially occluded faces (e.g. hand covering eyes/mouth).
 */
function validateFaceKeypoints(keypoints: MPKeypoint[] | undefined): boolean {
  if (!keypoints || keypoints.length < 4) return true; // can't validate → allow
  const rightEye = keypoints[0];
  const leftEye = keypoints[1];
  const mouth = keypoints[3];
  if (!rightEye || !leftEye || !mouth) return true;

  // Average eye Y should be above mouth Y (smaller Y = higher on screen in normalised coords)
  const eyeAvgY = (rightEye.y + leftEye.y) / 2;
  if (eyeAvgY > mouth.y) return false;

  // Eyes should have reasonable horizontal spacing (> 1% of image width)
  if (Math.abs(leftEye.x - rightEye.x) < 0.01) return false;

  return true;
}

/** Pick the largest face from detections, computing angle and validating geometry. */
function pickLargestFace(
  detections: {
    boundingBox?: { originX: number; originY: number; width: number; height: number };
    keypoints?: MPKeypoint[];
  }[]
): FaceBox | null {
  let best: FaceBox | null = null;
  let bestArea = 0;

  for (const d of detections) {
    const b = d.boundingBox;
    if (!b) continue;

    // Validate keypoints — reject occluded faces
    if (!validateFaceKeypoints(d.keypoints)) continue;

    const area = b.width * b.height;
    if (area > bestArea) {
      bestArea = area;
      best = {
        x: b.originX,
        y: b.originY,
        w: b.width,
        h: b.height,
        angle: computeFaceAngle(d.keypoints),
      };
    }
  }
  return best;
}

async function createFaceDetector(): Promise<FaceDetector> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  try {
    return await FaceDetector.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: BLAZE_FACE_MODEL,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.75,
    });
  } catch {
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: BLAZE_FACE_MODEL,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.75,
    });
  }
}

/**
 * Runs BlazeFace (MediaPipe) on each animation frame while `enabled` is true.
 */
export function useRealtimeFaceDetection(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean
): { faceBox: FaceBox | null; ready: boolean; error: string | null } {
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<FaceDetector | null>(null);
  const rafRef = useRef<number>(0);
  const lastEmittedRef = useRef<FaceBox | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    (async () => {
      try {
        const det = await createFaceDetector();
        if (cancelled) {
          det.close();
          return;
        }
        detectorRef.current = det;
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Face detector failed to load');
          setReady(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      detectorRef.current?.close();
      detectorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !ready || !detectorRef.current) {
      setFaceBox(null);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const detector = detectorRef.current;

    const tick = (now: number) => {
      if (!video.videoWidth || !video.videoHeight) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      try {
        const result = detector.detectForVideo(video, now);
        const face = pickLargestFace(result.detections);
        if (!facesClose(face, lastEmittedRef.current)) {
          lastEmittedRef.current = face;
          setFaceBox(face);
        }
      } catch {
        if (lastEmittedRef.current !== null) {
          lastEmittedRef.current = null;
          setFaceBox(null);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastEmittedRef.current = null;
      setFaceBox(null);
    };
  }, [enabled, ready, videoRef]);

  return { faceBox, ready, error };
}
