'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Hands } from '@mediapipe/hands';
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const nailImageRef = useRef(null);
  const handsRef = useRef(null);
  const loadingHandsRef = useRef(false);
  const animFrameRef = useRef(null);
  const processingRef = useRef(false);
  const facingModeRef = useRef('user');
  const nailSizeRef = useRef(100);

  const [error, setError] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(NAIL_DESIGNS[0]);
  const [availableDesigns, setAvailableDesigns] = useState(NAIL_DESIGNS);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [nailSize, setNailSize] = useState(100);
  const [handsDetected, setHandsDetected] = useState(false);
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Keep refs in sync with state
  useEffect(() => { facingModeRef.current = facingMode; }, [facingMode]);
  useEffect(() => { nailSizeRef.current = nailSize; }, [nailSize]);

  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent || '';
      const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      // Also check for touch support + small screen as a fallback
      const hasTouchAndSmallScreen = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 1024;
      setIsMobileDevice(isMobile || hasTouchAndSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load nail image
  const loadNailImage = useCallback(async (design) => {
    const img = new window.Image();
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

  // Process results — draw nails (uses refs to avoid re-creation on nailSize change)
  const onResults = useCallback(
    (results) => {
      const video = videoRef.current;
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
          const currentNailSize = nailSizeRef.current;
          results.multiHandLandmarks.forEach((landmarks, handIndex) => {
            const handedness = results.multiHandedness[handIndex]?.label || 'Right';

            // Calculate hand orientation (Back vs Palm)
            // Using cross product of vectors (Wrist->Index MCP) and (Wrist->Pinky MCP)
            const wrist = landmarks[0];
            const indexMcp = landmarks[5];
            const pinkyMcp = landmarks[17];

            const v1 = { x: indexMcp.x - wrist.x, y: indexMcp.y - wrist.y };
            const v2 = { x: pinkyMcp.x - wrist.x, y: pinkyMcp.y - wrist.y };

            // In MediaPipe's top-left origin coordinate system:
            // For Right hand back: Index is left of Pinky -> Cross product > 0
            // For Left hand back: Index is right of Pinky -> Cross product < 0
            // (Flipped signs as per user feedback to match actual camera/handedness mapping)
            const crossProduct = v1.x * v2.y - v1.y * v2.x;
            const isBack = handedness === 'Right' ? crossProduct < 0 : crossProduct > 0;

            // Only render nails if the back of the hand is facing the camera
            if (!isBack) return;

            // Finger tip indices and their corresponding DIP (joint below tip) indices
            // Thumb: tip=4, dip=3  |  Index: tip=8, dip=7  |  Middle: tip=12, dip=11
            // Ring: tip=16, dip=15  |  Pinky: tip=20, dip=19
            const fingerTips = [4, 8, 12, 16, 20];

            fingerTips.forEach((tipIndex) => {
              const tip = landmarks[tipIndex];
              const joint = landmarks[tipIndex - 1]; // DIP joint

              const tipX = tip.x * width;
              const tipY = tip.y * height;
              const jointX = joint.x * width;
              const jointY = joint.y * height;

              // Tip-to-DIP distance = nail bed length
              const tipToJoint = Math.sqrt((tipX - jointX) ** 2 + (tipY - jointY) ** 2);

              // Nail dimensions based on tip-to-DIP distance
              const scaleFactor = currentNailSize / 100;
              const nailHeight = tipToJoint * 1.3 * scaleFactor;
              const nailWidth = tipToJoint * 1.4 * scaleFactor;

              // Angle from tip pointing toward the joint (along the finger)
              const angle = Math.atan2(jointY - tipY, jointX - tipX);

              // Anchor at the fingertip — nail extends from tip toward the knuckle
              ctx.save();
              ctx.translate(tipX, tipY);
              ctx.rotate(angle - Math.PI / 2);
              // Shift nail slightly toward the finger so it sits on the nail bed
              const offsetY = nailHeight * 0.2;
              ctx.drawImage(nailImageRef.current, -nailWidth / 2, -nailHeight + offsetY, nailWidth, nailHeight);
              ctx.restore();
            });
          });
        }
      } else {
        setHandsDetected(false);
      }
      ctx.restore();
    },
    [] // No deps — uses refs for dynamic values
  );

  // Stop all tracks and cancel animation frame
  const stopEverything = useCallback(() => {
    // Cancel the detection loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    // Stop all media tracks
    try {
      const video = videoRef.current;
      if (video?.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(t => t.stop());
        video.srcObject = null;
      }
    } catch (_) { }
  }, []);

  // Initialize MediaPipe Hands (only once)
  const initializeHands = useCallback(async () => {
    // If instance already exists, use it
    if (handsRef.current) return handsRef.current;
    
    // If already loading, wait for it to finish
    if (loadingHandsRef.current) {
      while (loadingHandsRef.current) {
        await new Promise(r => setTimeout(r, 100));
      }
      return handsRef.current;
    }
    
    loadingHandsRef.current = true;
    setIsModelLoading(true);
    
    try {
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      });
      
      await hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      
      hands.onResults(onResults);
      await hands.initialize();

      if (!isMounted.current) {
        hands.close();
        return null;
      }

      handsRef.current = hands;
      setIsModelLoading(false);
      return hands;
    } catch (err) {
      console.error('Hands initialization failed:', err);
      setError('Failed to load AI model. Please check your internet connection and refresh.');
      stopEverything();
      setIsModelLoading(false);
      return null;
    } finally {
      loadingHandsRef.current = false;
    }
  }, [onResults, stopEverything]);

  // The detection loop — sends video frames to MediaPipe
  const startDetectionLoop = useCallback(() => {
    // Cancel any existing loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const detect = async () => {
      if (!isMounted.current) return;

      const video = videoRef.current;
      const hands = handsRef.current;

      if (video && hands && video.readyState === 4 && !processingRef.current) {
        processingRef.current = true;
        try {
          await hands.send({ image: video });
        } catch (err) {
          // Suppress "already deleted" errors that happen during cleanup
          if (!err.message?.includes('already deleted') && !err.message?.includes('disposed')) {
            console.warn('Hand detection frame error:', err.message);
          }
        }
        processingRef.current = false;
      }

      if (isMounted.current) {
        animFrameRef.current = requestAnimationFrame(detect);
      }
    };

    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  // Core: acquire the camera stream for a given facing mode
  const setupCamera = useCallback(async (mode) => {
    const video = videoRef.current;
    if (!video || !isMounted.current) return;

    try {
      setError(null);
      setIsCameraReady(false);

      // 1. Stop everything first
      stopEverything();

      // 2. Wait for hardware to release — critical for iOS
      await new Promise(r => setTimeout(r, 400));
      if (!isMounted.current) return;

      // 3. Build constraints — iOS needs 'user'/'environment' (no "exact"),
      //    Android works fine with both but "exact" can fail if no rear camera
      let constraints;
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');

      if (mode === 'user') {
        constraints = { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
      } else {
        if (isIOS) {
          // iOS Safari doesn't support { exact: 'environment' } reliably
          constraints = { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
        } else {
          // Android — try exact first, fall back to ideal
          constraints = { video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
        }
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (exactErr) {
        // Fallback: if exact environment failed (e.g. device has no rear camera), try without exact
        if (mode === 'environment') {
          console.warn('Exact environment failed, trying ideal fallback:', exactErr.message);
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } else {
          throw exactErr;
        }
      }

      if (!isMounted.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      // 4. Attach stream to video element
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.load(); // Force load to trigger events

      // 5. Wait for video to be ready (Polling + Events for maximum compatibility)
      await new Promise((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            console.warn('Video load taking longer than expected...');
            // Don't reject, just resolve and hope it eventually starts
            resolve();
          }
        }, 15000);

        const onVideoReady = () => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          video.onloadedmetadata = null;
          video.onloadeddata = null;
          video.oncanplay = null;
          video.play().then(resolve).catch(resolve);
        };

        // Polling fallback
        const checkVideo = () => {
          if (resolved || !isMounted.current) return;
          if (video.videoWidth > 0 && video.readyState >= 2) {
            onVideoReady();
          } else {
            requestAnimationFrame(checkVideo);
          }
        };

        if (video.readyState >= 2 && video.videoWidth > 0) {
          onVideoReady();
        } else {
          video.onloadedmetadata = onVideoReady;
          video.onloadeddata = onVideoReady;
          video.oncanplay = onVideoReady;
          requestAnimationFrame(checkVideo);
        }
      });

      if (!isMounted.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      // 6. Set canvas size
      if (canvasRef.current) {
        canvasRef.current.width = video.videoWidth || 1280;
        canvasRef.current.height = video.videoHeight || 720;
      }

      // 7. Initialize MediaPipe Hands if not yet done
      const hands = await initializeHands();
      if (!hands || !isMounted.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      // 8. Start the detection loop
      startDetectionLoop();
      setIsCameraReady(true);

    } catch (err) {
      console.error('Camera setup error:', err);
      setIsModelLoading(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another app. Please close it and try again.');
      } else if (err.name === 'OverconstrainedError') {
        // This camera mode is not available — silently revert
        setError('This camera is not available on your device.');
      } else {
        setError(err.message || 'Could not start camera.');
      }
      stopEverything();
    }
  }, [stopEverything, initializeHands, startDetectionLoop]);

  // Toggle camera (mobile only)
  const toggleCamera = useCallback(async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    setIsCameraReady(false);

    const newMode = facingModeRef.current === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);

    try {
      await setupCamera(newMode);
    } catch (err) {
      console.error('Camera toggle failed:', err);
    } finally {
      setIsSwitching(false);
    }
  }, [isSwitching, setupCamera]);

  // Init on mount
  useEffect(() => {
    isMounted.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('custom') === 'new') {
      setIsCustomizing(true);
    }

    // Start everything in parallel
    initializeHands();
    loadNailImage(NAIL_DESIGNS[0]);
    setupCamera('user');

    return () => {
      isMounted.current = false;
      stopEverything();
      if (handsRef.current) {
        handsRef.current.close().catch(() => { });
        handsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload nail image when design changes
  useEffect(() => {
    loadNailImage(selectedDesign);
  }, [selectedDesign, loadNailImage]);

  const handleNailSizeChange = (delta) => {
    setNailSize((prev) => Math.max(40, Math.min(200, prev + delta)));
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
        <video
          ref={videoRef}
          className="absolute w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          playsInline
          autoPlay
          muted
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
            onClick={() => stopEverything()}
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

            {/* Flip camera — ONLY visible on mobile devices */}
            {isMobileDevice && (
              <button
                onClick={toggleCamera}
                disabled={!isCameraReady || isSwitching}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-medium transition-all active:scale-95 ${isCameraReady && !isSwitching
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
            )}

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

      {/* Switching overlay */}
      {isSwitching && (
        <div className="absolute inset-0 z-35 bg-black/60 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-10 h-10 text-white animate-spin mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-white/80 text-sm font-medium">Switching Camera...</p>
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
                  setupCamera(facingModeRef.current);
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
