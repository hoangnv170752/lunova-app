import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Sparkles, RotateCcw, Download, ChevronLeft, Gem, CameraOff, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const rings = [
  { id: 1, name: 'Diamond Solitaire', price: '$2,499', color: '#F5F5F5', gem: '#A8D8EA' },
  { id: 2, name: 'Gold Band', price: '$899', color: '#FFD700', gem: '#FFD700' },
  { id: 3, name: 'Rose Gold Halo', price: '$1,799', color: '#B76E79', gem: '#FFB6C1' },
  { id: 4, name: 'Sapphire Crown', price: '$3,299', color: '#C0C0C0', gem: '#0F52BA' },
  { id: 5, name: 'Emerald Cut', price: '$4,199', color: '#FFD700', gem: '#50C878' },
  { id: 6, name: 'Ruby Princess', price: '$2,899', color: '#C0C0C0', gem: '#9B111E' },
];

type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

const ARTryOn: React.FC = () => {
  const [selectedRing, setSelectedRing] = useState(rings[0]);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
          setErrorMsg('Camera access was denied. Please allow camera permission in your browser settings and try again.');
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleDownload = useCallback(() => {
    if (!videoRef.current || cameraStatus !== 'active') return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `lunova-ar-${selectedRing.name.toLowerCase().replace(/ /g, '-')}.png`;
    a.click();
  }, [cameraStatus, selectedRing.name]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
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
        {/* Title */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Try On <span className="text-yellow-400">Virtually</span>
          </h1>
          <p className="text-gray-400">Use your camera to see how our jewelry looks on you in real time</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Camera View */}
          <div className="md:col-span-2">
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-[4/3] border border-gray-800">

              {/* Video element — always rendered so ref works */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${cameraStatus === 'active' ? 'block' : 'hidden'}`}
              />

              {/* Ring overlay on top of video */}
              {cameraStatus === 'active' && (
                <>
                  <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 pointer-events-none">
                    <div
                      className="w-20 h-10 rounded-full border-4 opacity-80"
                      style={{ borderColor: selectedRing.color, boxShadow: `0 0 24px ${selectedRing.gem}99` }}
                    />
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full"
                      style={{ backgroundColor: selectedRing.gem, boxShadow: `0 0 16px ${selectedRing.gem}` }}
                    />
                  </div>

                  {/* Controls */}
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <button
                      onClick={stopCamera}
                      className="p-2 bg-gray-800/80 rounded-full hover:bg-gray-700 transition-colors"
                      title="Stop camera"
                    >
                      <RotateCcw className="h-5 w-5 text-gray-300" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 bg-yellow-400/90 rounded-full hover:bg-yellow-300 transition-colors"
                      title="Save photo"
                    >
                      <Download className="h-5 w-5 text-black" />
                    </button>
                  </div>
                </>
              )}

              {/* Idle state */}
              {cameraStatus === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/30">
                    <Camera className="h-10 w-10 text-yellow-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">Enable Camera</p>
                    <p className="text-gray-500 text-sm">Allow camera access to try on jewelry</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="flex items-center space-x-2 bg-yellow-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-yellow-300 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Start Camera</span>
                  </button>
                </div>
              )}

              {/* Requesting */}
              {cameraStatus === 'requesting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-yellow-400/30 border-t-yellow-400 animate-spin" />
                  <p className="text-gray-400 text-sm">Requesting camera access…</p>
                </div>
              )}

              {/* Denied */}
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
                    onClick={startCamera}
                    className="flex items-center space-x-2 bg-gray-800 text-white px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors text-sm"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              )}

              {/* Selected ring badge */}
              {cameraStatus !== 'idle' && (
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-700 flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedRing.gem, boxShadow: `0 0 6px ${selectedRing.gem}` }}
                  />
                  <span className="text-sm text-white">{selectedRing.name}</span>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {['Hold hand at chest level', 'Good lighting helps', 'Keep fingers spread'].map((tip) => (
                <div key={tip} className="bg-gray-900 rounded-xl px-3 py-2 border border-gray-800 text-center">
                  <p className="text-gray-400 text-xs">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ring Selector */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-200">Choose a Ring</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {rings.map((ring) => (
                <button
                  key={ring.id}
                  onClick={() => setSelectedRing(ring)}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl border transition-all text-left ${
                    selectedRing.id === ring.id
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    <div
                      className="w-10 h-5 rounded-full border-[3px]"
                      style={{ borderColor: ring.color }}
                    />
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                      style={{ backgroundColor: ring.gem, boxShadow: `0 0 8px ${ring.gem}` }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{ring.name}</p>
                    <p className="text-yellow-400 text-sm">{ring.price}</p>
                  </div>
                  {selectedRing.id === ring.id && (
                    <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 border border-yellow-400/20 rounded-xl p-4 space-y-3">
              <p className="text-sm text-gray-300">
                Love what you see? Add <span className="text-yellow-400 font-medium">{selectedRing.name}</span> to your cart.
              </p>
              <button className="w-full bg-yellow-400 text-black py-2.5 rounded-lg font-semibold hover:bg-yellow-300 transition-colors">
                Add to Cart — {selectedRing.price}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARTryOn;
