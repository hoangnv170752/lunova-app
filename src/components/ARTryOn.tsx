import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  Sparkles,
  RotateCcw,
  Download,
  ChevronLeft,
  Gem,
  CameraOff,
  AlertCircle,
  Loader2,
  Wand2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { composeArTryOn, fetchArTryOnPresets, type ArComposeMeta } from '../api/arTryOn';
import { buildJewelleryCatalog, type JewelleryCatalogItem } from '../utils/jewelleryCatalog';
import { mapJewelleryOverlayStyle } from '../utils/arOverlayGeometry';
import { useRealtimeFaceDetection } from '../hooks/useRealtimeFaceDetection';

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

const ARTryOn: React.FC = () => {
  const [catalog, setCatalog] = useState<JewelleryCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedJewelId, setSelectedJewelId] = useState<string>(() => catalog[0]?.id ?? '');

  const selectedItem: JewelleryCatalogItem | undefined = useMemo(
    () => catalog.find((j) => j.id === selectedJewelId) ?? catalog[0],
    [catalog, selectedJewelId]
  );

  useEffect(() => {
    if (catalog.length && !catalog.some((j) => j.id === selectedJewelId)) {
      setSelectedJewelId(catalog[0].id);
    }
  }, [catalog, selectedJewelId]);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);

    fetchArTryOnPresets()
      .then((response) => {
        if (cancelled) return;
        setCatalog(buildJewelleryCatalog(response.presets));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setCatalog([]);
        setCatalogError(error instanceof Error ? error.message : 'Could not load jewellery presets');
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [arLoading, setArLoading] = useState(false);
  const [arError, setArError] = useState<string | null>(null);
  const [arNotice, setArNotice] = useState<string | null>(null);
  const [arResultUrl, setArResultUrl] = useState<string | null>(null);
  const [lastComposeMeta, setLastComposeMeta] = useState<ArComposeMeta | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [realtimeOn, setRealtimeOn] = useState(true);

  const { faceBox, ready: faceDetectorReady, error: faceDetectorError } = useRealtimeFaceDetection(
    videoRef,
    cameraStatus === 'active' && realtimeOn
  );

  useEffect(() => {
    return () => {
      if (arResultUrl) URL.revokeObjectURL(arResultUrl);
    };
  }, [arResultUrl]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
  }, []);

  const startCamera = useCallback(async () => {
    setCameraStatus('requesting');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus('active');
    } catch (err: unknown) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraStatus('denied');
          setErrorMsg(
            'Camera access was denied. Please allow camera permission in your browser settings and try again.'
          );
        } else if (err.name === 'NotFoundError') {
          setCameraStatus('error');
          setErrorMsg('No camera found on this device.');
        } else {
          setCameraStatus('error');
          setErrorMsg(`Camera error: ${err.message}`);
        }
      } else {
        setCameraStatus('error');
        setErrorMsg('An unexpected error occurred while accessing the camera.');
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const captureFrameBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || cameraStatus !== 'active') {
        resolve(null);
        return;
      }
      const v = videoRef.current;
      const w = v.videoWidth;
      const h = v.videoHeight;
      if (!w || !h) {
        resolve(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(v, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  }, [cameraStatus]);

  const handleApplyServerAr = useCallback(async () => {
    const item = selectedItem;
    if (!item) {
      setArError('No jewellery preset is available for AR rendering.');
      return;
    }
    setArError(null);
    setArNotice(null);
    setLastComposeMeta(null);
    const blob = await captureFrameBlob();
    if (!blob) {
      setArError('Could not capture frame. Is the camera on?');
      return;
    }
    setArLoading(true);
    try {
      if (arResultUrl) URL.revokeObjectURL(arResultUrl);
      const { blob: out, meta } = await composeArTryOn(
        blob,
        item.id,
        { flip_horizontal: true, return_original_if_no_face: true }
      );
      setLastComposeMeta(meta);
      setArResultUrl(URL.createObjectURL(out));
      if (meta.no_face_detected) {
        setArNotice('No face was detected in the captured frame, so the original snapshot was returned. Try facing the camera directly with better light.');
      }
    } catch (e) {
      setArError(e instanceof Error ? e.message : 'Final AR rendering failed');
    } finally {
      setArLoading(false);
    }
  }, [captureFrameBlob, selectedItem, arResultUrl]);

  const handleDownload = useCallback(async () => {
    if (arResultUrl) {
      const a = document.createElement('a');
      a.href = arResultUrl;
      a.download = `lunova-final-${selectedItem?.id ?? 'jewel'}.png`;
      a.click();
      return;
    }
    if (!videoRef.current || cameraStatus !== 'active') return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const label = selectedItem?.name ?? 'preview';
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `lunova-preview-${label.toLowerCase().replace(/ /g, '-')}.png`;
    a.click();
  }, [cameraStatus, arResultUrl, selectedItem]);

  const meta = selectedItem ?? {
    name: 'Jewellery',
    price: '',
    color: '#888',
    gem: '#FDE68A',
    imageUrl: '',
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/landing"
              onClick={stopCamera}
              className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </Link>
            <div className="w-px h-5 bg-gray-700" />
            <div className="flex items-center space-x-2">
              <Gem className="h-5 w-5 text-yellow-400" />
              <span className="text-lg font-bold lunova-brand">Lunova</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">AR Try On</span>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-8 px-4 container mx-auto">
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Try On <span className="text-yellow-400">Virtually</span>
          </h1>
          <p className="text-gray-400">
            <strong className="text-gray-300">Approximate preview</strong> uses MediaPipe in your browser.{' '}
            <strong className="text-gray-300">Final result</strong> uses the backend Haar detector and is the
            authoritative render for face and neck jewellery placement.
          </p>
          <label className="inline-flex items-center gap-2 mt-3 text-sm text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
              checked={realtimeOn}
              onChange={(e) => setRealtimeOn(e.target.checked)}
            />
            Approximate realtime preview (MediaPipe)
            {!faceDetectorReady && realtimeOn && cameraStatus === 'active' && (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
            )}
          </label>
          {faceDetectorError && (
            <p className="text-amber-400 text-sm mt-1">Face model: {faceDetectorError}</p>
          )}
          {catalogLoading && (
            <p className="text-gray-500 text-sm mt-2">Loading jewellery presets from the API…</p>
          )}
          {catalogError && (
            <p className="text-amber-400 text-sm mt-2">Preset API: {catalogError}</p>
          )}
          {!catalogLoading && !catalogError && catalog.length === 0 && (
            <p className="text-amber-400 text-sm mt-2">
              No jewellery presets could be rendered. Check `/ar-tryon/presets` and local preview assets.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-[4/3] border border-gray-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-contain bg-black scale-x-[-1] ${cameraStatus === 'active' ? 'block' : 'hidden'
                  }`}
              />

              {cameraStatus === 'active' &&
                realtimeOn &&
                selectedItem?.imageUrl &&
                faceBox &&
                videoRef.current && (
                  <img
                    src={selectedItem.imageUrl}
                    alt={`${selectedItem.name} approximate preview`}
                    className="object-contain drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]"
                    style={mapJewelleryOverlayStyle(
                      videoRef.current,
                      faceBox,
                      selectedItem.x,
                      selectedItem.y,
                      selectedItem.dw,
                      selectedItem.dh,
                      true,
                      {
                        dropFactor: selectedItem.drop_factor ?? 0,
                        useFaceHeightForScale: selectedItem.use_face_height ?? false,
                      }
                    )}
                  />
                )}

              {cameraStatus === 'active' && realtimeOn && selectedItem?.imageUrl && (
                <div className="absolute top-4 right-4 z-20 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">
                  Approximate preview
                </div>
              )}

              {cameraStatus === 'active' && selectedItem?.imageUrl && (
                <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 justify-end z-20">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2 bg-gray-800/80 rounded-full hover:bg-gray-700 transition-colors"
                    title="Stop camera"
                  >
                    <RotateCcw className="h-5 w-5 text-gray-300" />
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyServerAr}
                    disabled={arLoading || !catalog.length || catalogLoading}
                    className="p-2 bg-violet-500/90 rounded-full hover:bg-violet-400 transition-colors disabled:opacity-50"
                    title="Render final jewellery try-on"
                  >
                    {arLoading ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Wand2 className="h-5 w-5 text-white" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="p-2 bg-yellow-400/90 rounded-full hover:bg-yellow-300 transition-colors"
                    title={arResultUrl ? 'Download final result' : 'Save camera snapshot'}
                  >
                    <Download className="h-5 w-5 text-black" />
                  </button>
                </div>
              )}

              {cameraStatus === 'active' && !selectedItem?.imageUrl && (
                <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2 bg-gray-800/80 rounded-full hover:bg-gray-700 transition-colors"
                    title="Stop camera"
                  >
                    <RotateCcw className="h-5 w-5 text-gray-300" />
                  </button>
                </div>
              )}

              {cameraStatus === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/30">
                    <Camera className="h-10 w-10 text-yellow-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">Enable Camera</p>
                    <p className="text-gray-500 text-sm">Allow camera access to preview face and neck jewellery</p>
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center space-x-2 bg-yellow-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-yellow-300 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Start Camera</span>
                  </button>
                </div>
              )}

              {cameraStatus === 'requesting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-yellow-400/30 border-t-yellow-400 animate-spin" />
                  <p className="text-gray-400 text-sm">Requesting camera access…</p>
                </div>
              )}

              {(cameraStatus === 'denied' || cameraStatus === 'error') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 px-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30">
                    {cameraStatus === 'denied' ? (
                      <CameraOff className="h-8 w-8 text-red-400" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    )}
                  </div>
                  <p className="text-red-400 text-sm">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center space-x-2 bg-gray-800 text-white px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors text-sm"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              )}

              {cameraStatus !== 'idle' && selectedItem && (
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-700 flex items-center gap-2 max-w-[85%]">
                  <img
                    src={selectedItem.imageUrl}
                    alt=""
                    className="w-7 h-7 object-contain rounded"
                  />
                  <span className="text-sm text-white truncate">{selectedItem.name}</span>
                </div>
              )}
            </div>

            {arNotice && (
              <div className="rounded-xl border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                {arNotice}
              </div>
            )}

            {arError && (
              <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {arError}
              </div>
            )}

            {arResultUrl && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/80 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-200">Final result (backend)</span>
                  {lastComposeMeta && (
                    <span className="text-xs text-gray-500">
                      Detector: {lastComposeMeta.detector.toUpperCase()} · Faces detected: {lastComposeMeta.face_count}
                    </span>
                  )}
                </div>
                <img src={arResultUrl} alt="Final AR try-on result" className="w-full max-h-[480px] object-contain bg-black" />
                {lastComposeMeta && (
                  <div className="grid gap-3 border-t border-gray-800 px-4 py-3 text-xs text-gray-400 md:grid-cols-3">
                    <div>
                      Output: {lastComposeMeta.output_width}×{lastComposeMeta.output_height} · {lastComposeMeta.output_format.toUpperCase()}
                    </div>
                    <div>
                      Placement: x {lastComposeMeta.placement.x}, y {lastComposeMeta.placement.y}, dw {lastComposeMeta.placement.dw}, dh {lastComposeMeta.placement.dh}
                    </div>
                    <div>
                      {lastComposeMeta.no_face_detected
                        ? `Fallback: ${lastComposeMeta.detection_reason ?? 'No face detected'}`
                        : lastComposeMeta.face_box
                          ? `Face box: ${lastComposeMeta.face_box.w}×${lastComposeMeta.face_box.h}`
                          : 'Face metadata unavailable'}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {['Face the camera directly', 'One face in frame works best', 'Necklaces sit best with visible neck and good light'].map(
                (tip) => (
                  <div key={tip} className="bg-gray-900 rounded-xl px-3 py-2 border border-gray-800 text-center">
                    <p className="text-gray-400 text-xs">{tip}</p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-200">Choose jewellery</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {catalog.map((item) => {
                const selected = selectedJewelId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedJewelId(item.id)}
                    className={`w-full flex items-center space-x-4 p-4 rounded-xl border transition-all text-left ${selected
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                      }`}
                  >
                    <div className="relative flex-shrink-0 w-14 h-14 rounded-lg bg-black/40 border border-gray-700 flex items-center justify-center overflow-hidden">
                      <img src={item.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{item.name}</p>
                      <p className="text-yellow-400 text-sm">{item.price}</p>
                      <p className="text-gray-500 text-xs truncate">{item.file}</p>
                    </div>
                    {selected && <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 border border-yellow-400/20 rounded-xl p-4 space-y-3">
              <p className="text-sm text-gray-300">
                Love what you see? Add <span className="text-yellow-400 font-medium">{meta.name}</span> to your cart.
              </p>
              <button
                type="button"
                className="w-full bg-yellow-400 text-black py-2.5 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                Add to Cart — {meta.price || '—'}
              </button>
              <button
                type="button"
                disabled={cameraStatus !== 'active' || arLoading || !catalog.length || catalogLoading}
                onClick={handleApplyServerAr}
                className="w-full bg-violet-500 text-white py-2.5 rounded-lg font-semibold hover:bg-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {arLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                Render final try-on
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARTryOn;
