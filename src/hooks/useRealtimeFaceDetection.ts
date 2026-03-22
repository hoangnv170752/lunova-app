import { useEffect, useRef, useState, type RefObject } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import type { FaceBox } from '../lib/arOverlayGeometry';

const MP_VERSION = '0.10.14';
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const BLAZE_FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite';

function facesClose(a: FaceBox | null, b: FaceBox | null, eps = 6): boolean {
  if (a === null && b === null) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.w - b.w) < eps &&
    Math.abs(a.h - b.h) < eps
  );
}

function pickLargestFace(detections: { boundingBox?: { originX: number; originY: number; width: number; height: number } }[]): FaceBox | null {
  let best: FaceBox | null = null;
  let bestArea = 0;
  for (const d of detections) {
    const b = d.boundingBox;
    if (!b) continue;
    const area = b.width * b.height;
    if (area > bestArea) {
      bestArea = area;
      best = { x: b.originX, y: b.originY, w: b.width, h: b.height };
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
      minDetectionConfidence: 0.5,
    });
  } catch {
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: BLAZE_FACE_MODEL,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
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
