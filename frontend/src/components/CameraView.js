'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import Webcam from 'react-webcam';
import NailDesignCustomizer from './NailDesignCustomizer';

const NAIL_DESIGNS = [
  { id: 1, name: 'French', image: '/images/nails/french.png', color: '#f5d5c8' },
  { id: 2, name: 'Rose Gold', image: '/images/nails/gold.png', color: '#d4a574' },
  { id: 3, name: 'Pink', image: '/images/nails/pink.png', color: '#ec4899' },
];

class CameraErrorBoundary extends React.Component {
  state = { hasError: false, errorMsg: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Camera Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[100dvh] bg-black text-white px-6">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Camera Error</h2>
            <p className="text-gray-500 text-sm mb-5">{this.state.errorMsg || 'Something went wrong.'}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CameraWrapper() {
  return (
    <CameraErrorBoundary>
      <CameraView />
    </CameraErrorBoundary>
  );
}

function CameraView() {
  const isMounted = useRef(true);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const nailImageRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  const [error, setError] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(NAIL_DESIGNS[0]);
  const [availableDesigns, setAvailableDesigns] = useState(NAIL_DESIGNS);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [nailSize, setNailSize] = useState(62);
  const [handsDetected, setHandsDetected] = useState(false);
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [facingMode, setFacingMode] = useState('user');

  // Load nail image
  const loadNailImage = useCallback(async (design) => {
    const img = new window.Image();
    // Only set crossOrigin for actual URLs, not for data URLs from sessionStorage
    if (!design.image.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = design.image;
    return new Promise((resolve) => {
      img.onload = () => {
        nailImageRef.current = img;
        resolve();
      };
      img.onerror = () => {
        console.error('Failed to load nail image:', design.image);
        resolve();
      };
    });
  }, []);

  // Initialize MediaPipe Hands
  const initializeHands = useCallback(async () => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    await hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
    return hands;
  }, []);

  // Stop camera and clean up
  const stopCurrentCamera = useCallback(() => {
    try {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
    } catch (_) { }
  }, []);

  // Process results — draw nails
  const onResults = useCallback(
    (results) => {
      const video = webcamRef.current?.video;
      if (!isMounted.current || !video || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      canvas.width = width;
      canvas.height = height;
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(results.image, 0, 0, width, height);

      if (results.multiHandLandmarks?.length > 0) {
        setHandsDetected(true);
        if (nailImageRef.current) {
          for (const [idx, landmarks] of results.multiHandLandmarks.entries()) {
            const handedness = results.multiHandedness[idx].label;
            const wrist = landmarks[0];
            const index_tip = landmarks[8];
            const middle = landmarks[12];
            const pinky = landmarks[20];

            const v1 = { x: middle.x - wrist.x, y: middle.y - wrist.y, z: middle.z - wrist.z };
            const v2 = { x: pinky.x - index_tip.x, y: pinky.y - index_tip.y, z: pinky.z - index_tip.z };
            const normal_z = v1.x * v2.y - v1.y * v2.x;
            const isPalmAway = handedness === 'Left' ? normal_z > 0 : normal_z < 0;

            if (isPalmAway) {
              [4, 8, 12, 16, 20].forEach((tipIndex) => {
                const tip = landmarks[tipIndex];
                const joint = landmarks[tipIndex - 1];
                const x = tip.x * width;
                const y = tip.y * height;
                const jx = joint.x * width;
                const jy = joint.y * height;
                const fingerWidth = Math.sqrt((x - jx) ** 2 + (y - jy) ** 2);
                const sz = Math.min(fingerWidth * 1.2, nailSize);
                const angle = Math.atan2(joint.y - tip.y, joint.x - tip.x);

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle - Math.PI / 2);
                ctx.drawImage(nailImageRef.current, -sz / 2, -sz / 2 - sz * 0.2, sz, sz);
                ctx.restore();
              });
            }
          }
        }
      } else {
        setHandsDetected(false);
      }
      ctx.restore();
    },
    [nailSize]
  );

  const handleUserMedia = useCallback(async () => {
    setIsCameraReady(false);
    const video = webcamRef.current?.video;
    if (!video) return;

    video.setAttribute('playsinline', 'true');

    if (canvasRef.current) {
      canvasRef.current.width = video.videoWidth || 1280;
      canvasRef.current.height = video.videoHeight || 720;
    }

    try {
      let hands = handsRef.current;
      if (!hands) {
        setIsModelLoading(true);
        hands = await initializeHands();
        await hands.initialize();
        if (!isMounted.current) {
          hands.close();
          return;
        }
        handsRef.current = hands;
        hands.onResults(onResults);
      }
      setIsModelLoading(false);

      if (cameraRef.current) {
        cameraRef.current.stop();
      }

      const camera = new Camera(video, {
        onFrame: async () => {
          if (handsRef.current && isMounted.current && video.readyState === 4) {
            try {
              await handsRef.current.send({ image: video });
            } catch (err) {
              if (!err.message?.includes('already deleted')) {
                console.error('Hand detection error:', err);
              }
            }
          }
        },
      });

      cameraRef.current = camera;
      await camera.start();
      setIsCameraReady(true);
    } catch (err) {
      console.error('Model or camera start error:', err);
      setIsModelLoading(false);
    } finally {
      setIsSwitching(false);
    }
  }, [initializeHands, onResults]);

  const handleUserMediaError = useCallback((err) => {
    console.error('Webcam access error:', err);
    setIsModelLoading(false);
    setIsSwitching(false);
    setError(typeof err === 'string' ? err : err.message || 'Camera permission denied or not found.');
  }, []);

  const toggleCamera = useCallback(() => {
    if (isSwitching) return;
    setIsSwitching(true);
    setIsCameraReady(false);
    stopCurrentCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [isSwitching, stopCurrentCamera]);

  // Init on mount
  useEffect(() => {
    isMounted.current = true;
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('custom') === 'new') {
      setIsCustomizing(true);
    }
    
    let initial = NAIL_DESIGNS[0];
    
    loadNailImage(initial);
    return () => {
      isMounted.current = false;
      stopCurrentCamera();
      if (handsRef.current) {
        handsRef.current.close().catch(() => {});
        handsRef.current = null;
      }
    };
  }, [loadNailImage, stopCurrentCamera]);

  // Reload nail image when design changes
  useEffect(() => {
    loadNailImage(selectedDesign);
  }, [selectedDesign, loadNailImage]);

  const handleNailSizeChange = (delta) => {
    setNailSize((prev) => Math.max(24, Math.min(120, prev + delta)));
  };

  // Capture screenshot
  const captureScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `nailedge-tryon-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden touch-none">
      {/* Camera feed */}
      <div className="absolute inset-0">
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{ facingMode }}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="absolute w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          playsInline={true}
          autoPlay={true}
          muted={true}
        />
        <canvas 
          ref={canvasRef} 
          className="absolute w-full h-full object-cover" 
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
      </div>

      {/* Top bar — safe area aware */}
      <div className="absolute top-0 left-0 right-0 z-30 safe-top">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-black/40 backdrop-blur-xl text-white text-xs sm:text-sm font-medium active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </Link>

          {/* Status */}
          <div className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-black/40 backdrop-blur-xl">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${handsDetected ? 'bg-green-500 animate-pulse' : isCameraReady ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className="text-white/80 text-[11px] sm:text-xs font-medium whitespace-nowrap">
              {isModelLoading ? 'Loading AI...' : handsDetected ? 'Hands Detected' : isCameraReady ? 'Show Hands' : 'Starting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Design selector toggle */}
      <button
        onClick={() => setShowDesignPanel(!showDesignPanel)}
        className="absolute bottom-[88px] sm:bottom-24 left-1/2 -translate-x-1/2 z-30 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black/40 backdrop-blur-xl text-white text-xs sm:text-sm font-medium flex items-center gap-2 active:scale-95 transition-transform"
      >
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white/30 flex-shrink-0" style={{ backgroundColor: selectedDesign.color }} />
        {selectedDesign.name}
        <svg className={`w-3.5 h-3.5 transition-transform ${showDesignPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Design panel */}
      {showDesignPanel && (
        <div className="absolute bottom-[130px] sm:bottom-36 left-4 right-4 z-30 flex justify-center animate-fade-in">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 sm:p-4 w-full max-w-xs">
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2.5 text-center font-medium">Nail Designs</p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {availableDesigns.map((design) => (
                <button
                  key={design.id}
                  onClick={() => {
                    setSelectedDesign(design);
                    setShowDesignPanel(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl transition-all active:scale-95 ${selectedDesign.id === design.id ? 'bg-pink-500/20 ring-1 ring-pink-500/50' : 'hover:bg-white/5'
                    }`}
                >
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 transition-all"
                    style={{ borderColor: selectedDesign.id === design.id ? '#ec4899' : 'rgba(255,255,255,0.1)' }}
                  >
                    <img src={design.image} alt={design.name} className="w-full h-full object-contain bg-white/5" />
                  </div>
                  <span className="text-white text-[11px] sm:text-xs font-medium">{design.name}</span>
                </button>
              ))}
              
              {/* Add Custom Design Button */}
              <button
                onClick={() => {
                  setShowDesignPanel(false);
                  setIsCustomizing(true);
                }}
                className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl transition-all hover:bg-white/5 active:scale-95"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:border-white/50 transition-all bg-white/5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-white/70 text-[11px] sm:text-xs font-medium">Custom</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls — safe area aware */}
      <div className="absolute bottom-0 left-0 right-0 z-30 safe-bottom">
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2 sm:gap-3">
            {/* Size controls */}
            <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-black/40 backdrop-blur-xl">
              <button
                onClick={() => handleNailSizeChange(-4)}
                className="w-8 h-8 rounded-full bg-white/10 text-white active:bg-white/30 transition-colors flex items-center justify-center text-base font-light"
              >
                −
              </button>
              <span className="text-white/50 text-[11px] w-6 text-center tabular-nums">{nailSize}</span>
              <button
                onClick={() => handleNailSizeChange(4)}
                className="w-8 h-8 rounded-full bg-white/10 text-white active:bg-white/30 transition-colors flex items-center justify-center text-base font-light"
              >
                +
              </button>
            </div>

            {/* Flip camera — larger tap target on mobile */}
            <button
              onClick={toggleCamera}
              disabled={!isCameraReady || isSwitching}
              className={`flex-shrink-0 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-95 ${isCameraReady && !isSwitching
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/20'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className={`w-4 h-4 ${isSwitching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isSwitching ? 'Flipping...' : 'Flip'}
              </span>
            </button>

            {/* Capture */}
            <div className="flex items-center px-2.5 py-2 rounded-full bg-black/40 backdrop-blur-xl">
              <button
                onClick={captureScreenshot}
                className="w-9 h-9 rounded-full bg-white/10 text-white active:bg-white/30 transition-colors flex items-center justify-center"
                title="Capture"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isModelLoading && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-sm sm:text-base mb-1.5">Loading AI Model</p>
            <p className="text-gray-500 text-xs sm:text-sm">Setting up hand detection...</p>
            <div className="mt-4 w-28 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full w-3/5 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center px-4">
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-base mb-1.5">Camera Error</h3>
            <p className="text-gray-400 text-xs sm:text-sm mb-5 leading-relaxed">{error}</p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setError(null);
                  setIsSwitching(true);
                  setFacingMode(prev => {
                    setTimeout(() => setFacingMode(prev), 100);
                    return prev === 'user' ? 'environment' : 'user';
                  });
                }}
                className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full text-white font-medium text-sm active:scale-95 transition-transform"
              >
                Try Again
              </button>
              <Link href="/" className="w-full py-2.5 bg-white/5 rounded-full text-white/60 font-medium text-sm text-center active:scale-95 transition-transform">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Close design panel when tapping outside */}
      {showDesignPanel && <div className="absolute inset-0 z-20" onClick={() => setShowDesignPanel(false)} />}
      
      {/* Customizer Overlay */}
      {isCustomizing && (
        <NailDesignCustomizer 
          onClose={() => setIsCustomizing(false)}
          onApply={(dataUrl, customDesignId) => {
            const customDesign = { id: customDesignId, name: 'Custom', image: dataUrl, color: '#a855f7' };
            setAvailableDesigns([customDesign, ...availableDesigns.filter(d => !d.id.toString().startsWith('custom_'))]);
            setSelectedDesign(customDesign);
            setIsCustomizing(false);
          }}
        />
      )}
    </div>
  );
}
