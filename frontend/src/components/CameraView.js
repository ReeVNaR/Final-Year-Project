'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

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
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Camera initialization failed</h2>
            <p className="text-gray-500 text-sm mb-6">{this.state.errorMsg || 'Something went wrong with the camera.'}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full text-sm font-medium hover:from-pink-500 hover:to-purple-500 transition-all"
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const nailImageRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(NAIL_DESIGNS[0]);
  const [facingMode, setFacingMode] = useState('user');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [nailSize, setNailSize] = useState(62);
  const [handsDetected, setHandsDetected] = useState(false);
  const [showDesignPanel, setShowDesignPanel] = useState(false);

  // Load nail image
  const loadNailImage = useCallback(async (design) => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = design.image;

    return new Promise((resolve, reject) => {
      img.onload = () => {
        nailImageRef.current = img;
        setImageLoaded(true);
        resolve();
      };
      img.onerror = (err) => {
        console.error('Error loading nail image:', err);
        setImageLoaded(true);
        reject(err);
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
  const stopCurrentCamera = useCallback(async () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (_) { }
      cameraRef.current = null;
    }
    if (handsRef.current) {
      try { await handsRef.current.close(); } catch (_) { }
      handsRef.current = null;
    }
  }, []);

  // Process hand tracking results and draw nails
  const onResults = useCallback((results) => {
    if (!isMounted.current || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(results.image, 0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandsDetected(true);

      if (nailImageRef.current) {
        for (const [index, landmarks] of results.multiHandLandmarks.entries()) {
          const handedness = results.multiHandedness[index].label;

          // Palm orientation detection
          const wrist = landmarks[0];
          const index_tip = landmarks[8];
          const middle = landmarks[12];
          const pinky = landmarks[20];

          const v1 = {
            x: middle.x - wrist.x,
            y: middle.y - wrist.y,
            z: middle.z - wrist.z,
          };
          const v2 = {
            x: pinky.x - index_tip.x,
            y: pinky.y - index_tip.y,
            z: pinky.z - index_tip.z,
          };

          // Cross product for palm normal
          const normal_z = v1.x * v2.y - v1.y * v2.x;
          const isPalmAway = handedness === 'Left' ? normal_z > 0 : normal_z < 0;

          if (isPalmAway) {
            const fingertips = [4, 8, 12, 16, 20];
            fingertips.forEach((tipIndex) => {
              const tip = landmarks[tipIndex];
              const joint = landmarks[tipIndex - 1];
              const x = tip.x * width;
              const y = tip.y * height;
              const jx = joint.x * width;
              const jy = joint.y * height;

              const fingerWidth = Math.sqrt((x - jx) ** 2 + (y - jy) ** 2);
              const currentNailSize = Math.min(fingerWidth * 1.2, nailSize);
              const angle = Math.atan2(joint.y - tip.y, joint.x - tip.x);

              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(angle - Math.PI / 2);
              ctx.drawImage(
                nailImageRef.current,
                -currentNailSize / 2,
                -currentNailSize / 2 - currentNailSize * 0.2,
                currentNailSize,
                currentNailSize
              );
              ctx.restore();
            });
          }
        }
      }
    } else {
      setHandsDetected(false);
    }

    ctx.restore();
  }, [nailSize]);

  // Setup camera
  const setupCamera = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      await stopCurrentCamera();
      setIsCameraReady(false);
      setIsModelLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (!isMounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            if (canvasRef.current) {
              canvasRef.current.width = settings.width || 1280;
              canvasRef.current.height = settings.height || 720;
            }
            resolve();
          };
        });
      }

      const hands = await initializeHands();
      await hands.initialize();

      if (!isMounted.current) {
        hands.close();
        return;
      }

      handsRef.current = hands;
      hands.onResults(onResults);
      setIsModelLoading(false);

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && isMounted.current && videoRef.current?.readyState === 4) {
            try {
              await handsRef.current.send({ image: videoRef.current });
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
      console.error('Camera setup error:', err);
      setIsModelLoading(false);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access and try again.'
          : err.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : 'Failed to initialize camera. Please refresh and try again.'
      );
    }
  }, [facingMode, stopCurrentCamera, initializeHands, onResults]);

  // Toggle front/back camera
  const toggleCamera = useCallback(async () => {
    setIsSwitching(true);
    setIsCameraReady(false);
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // Init on mount
  useEffect(() => {
    isMounted.current = true;
    loadNailImage(NAIL_DESIGNS[0]);
    setupCamera();
    return () => {
      isMounted.current = false;
      stopCurrentCamera();
    };
  }, []);

  // Re-setup camera when facingMode changes (from toggle)
  useEffect(() => {
    if (isSwitching) {
      setupCamera().finally(() => setIsSwitching(false));
    }
  }, [facingMode]);

  // Reload nail image when design changes
  useEffect(() => {
    loadNailImage(selectedDesign);
  }, [selectedDesign, loadNailImage]);

  const handleNailSizeChange = (delta) => {
    setNailSize((prev) => Math.max(24, Math.min(120, prev + delta)));
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Camera feed */}
      <div className="absolute inset-0">
        <video ref={videoRef} className="absolute w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="absolute w-full h-full object-cover" />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full glass text-white text-sm font-medium hover:bg-white/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full glass">
          <span className={`w-2 h-2 rounded-full ${handsDetected ? 'bg-green-500 animate-pulse' : isCameraReady ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-white/80 text-xs font-medium">
            {isModelLoading ? 'Loading AI...' : handsDetected ? 'Hands Detected' : isCameraReady ? 'Show Your Hands' : 'Initializing...'}
          </span>
        </div>
      </div>

      {/* Design selector toggle */}
      <button
        onClick={() => setShowDesignPanel(!showDesignPanel)}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full glass text-white text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-all"
      >
        <div className="w-5 h-5 rounded-full border-2 border-current" style={{ backgroundColor: selectedDesign.color }} />
        {selectedDesign.name}
        <svg className={`w-4 h-4 transition-transform ${showDesignPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Design panel */}
      {showDesignPanel && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-30 glass-strong rounded-2xl p-4 animate-fade-in">
          <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] mb-3 text-center">Nail Designs</p>
          <div className="flex gap-3">
            {NAIL_DESIGNS.map((design) => (
              <button
                key={design.id}
                onClick={() => {
                  setSelectedDesign(design);
                  setShowDesignPanel(false);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${selectedDesign.id === design.id
                    ? 'bg-pink-500/20 ring-1 ring-pink-500/50'
                    : 'hover:bg-white/5'
                  }`}
              >
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: selectedDesign.id === design.id ? '#ec4899' : 'rgba(255,255,255,0.1)' }}
                >
                  <img src={design.image} alt={design.name} className="w-full h-full object-contain bg-white/5" />
                </div>
                <span className="text-white text-xs font-medium">{design.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-0 right-0 z-30 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          {/* Size controls */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-full glass">
            <button
              onClick={() => handleNailSizeChange(-4)}
              className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center text-lg font-light"
            >
              −
            </button>
            <span className="text-white/60 text-xs w-8 text-center">{nailSize}</span>
            <button
              onClick={() => handleNailSizeChange(4)}
              className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center text-lg font-light"
            >
              +
            </button>
          </div>

          {/* Switch camera */}
          <button
            onClick={toggleCamera}
            disabled={!isCameraReady || isSwitching}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${isCameraReady && !isSwitching
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isSwitching ? 'Switching...' : 'Flip Camera'}
            </span>
          </button>

          {/* Capture button placeholder */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-full glass">
            <button
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const link = document.createElement('a');
                link.download = `nailedge-tryon-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
              }}
              className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
              title="Capture"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isModelLoading && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">Loading AI Model</p>
            <p className="text-gray-500 text-sm">Setting up hand detection...</p>
            <div className="mt-4 w-32 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-shimmer" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center px-6">
          <div className="glass-strong rounded-3xl p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Camera Error</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setupCamera();
              }}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full text-white font-medium text-sm hover:from-pink-500 hover:to-purple-500 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
