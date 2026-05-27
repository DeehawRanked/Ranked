'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState('');
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setError('');
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      setError('Camera access was denied or is unavailable on this device.');
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    startCamera();
    return stopStream;
  }, [startCamera, stopStream]);

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror for front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    stopStream();
  }

  function retake() {
    setCaptured('');
    startCamera();
  }

  function confirm() {
    onCapture(captured);
    onClose();
  }

  function flipCamera() {
    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'));
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white text-sm font-semibold px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 transition-colors"
        >
          ✕ Cancel
        </button>
        <span className="text-white font-black text-sm uppercase tracking-widest">
          {captured ? 'Preview' : 'Camera'}
        </span>
        {!captured && (
          <button
            onClick={flipCamera}
            className="text-zinc-400 hover:text-white text-sm font-semibold px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 transition-colors"
          >
            🔄 Flip
          </button>
        )}
        {captured && <div className="w-16" />}
      </div>

      {/* Viewfinder / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-zinc-500 text-sm">Starting camera…</div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 px-8 gap-4">
                <span className="text-4xl">📷</span>
                <p className="text-zinc-400 text-sm text-center">{error}</p>
                <button
                  onClick={startCamera}
                  className="text-white font-bold text-sm bg-red-600 px-4 py-2 rounded-xl"
                >
                  Try Again
                </button>
              </div>
            )}
            {/* Corner guides */}
            {ready && (
              <div className="absolute inset-0 pointer-events-none">
                {[
                  'top-6 left-6 border-t-2 border-l-2',
                  'top-6 right-6 border-t-2 border-r-2',
                  'bottom-6 left-6 border-b-2 border-l-2',
                  'bottom-6 right-6 border-b-2 border-r-2',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 border-red-500/60 ${cls}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <img src={captured} alt="Captured" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 pb-10 pt-6 flex items-center justify-center gap-8 bg-black">
        {!captured ? (
          <>
            {/* Shutter button */}
            <button
              onClick={captureFrame}
              disabled={!ready}
              className="w-18 h-18 rounded-full border-4 border-white bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition-all active:scale-95"
              style={{ width: 72, height: 72 }}
              aria-label="Take photo"
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={retake}
              className="px-6 py-3 rounded-2xl border border-zinc-700 bg-zinc-900 text-white font-bold text-sm transition-colors hover:border-zinc-500"
            >
              Retake
            </button>
            <button
              onClick={confirm}
              className="px-8 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm transition-colors"
            >
              Use Photo →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
