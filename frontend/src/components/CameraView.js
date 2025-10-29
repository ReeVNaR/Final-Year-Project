'use client';
import React from 'react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const NAIL_DESIGNS = [
  { id: 1, name: 'Basic', image: '/nail.png' },
  { id: 2, name: 'French', image: '/french-nail.png' },
  { id: 3, name: 'Glitter', image: '/glitter-nail.png' },
];

class CameraErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Camera Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
          <div className="text-center">
            <h2 className="text-xl mb-4">Camera initialization failed</h2>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-pink-600 rounded-full"
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
  // Add mounted ref
  const isMounted = useRef(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const nailImageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [nailImages, setNailImages] = useState({});
  const [selectedDesign, setSelectedDesign] = useState(NAIL_DESIGNS[0]);
  const [facingMode, setFacingMode] = useState('environment');
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  const loadNailImage = async (design = selectedDesign) => {
    setImageLoaded(false);
    const img = new Image();
    img.src = design.image;
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        nailImageRef.current = img;
        setImageLoaded(true);
        resolve();
      };
      img.onerror = (err) => {
        console.error('Error loading nail image:', err);
        setError('Failed to load nail image');
        setImageLoaded(true);
        reject(err);
      };
    });
  };

  const initializeHands = async () => {
    try {
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      // Wait for any previous instance to be fully cleaned up
      await new Promise(resolve => setTimeout(resolve, 100));

      await hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      return hands;
    } catch (err) {
      console.error('Failed to initialize hands:', err);
      throw err;
    }
  };

  const stopCurrentCamera = async () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (handsRef.current) {
      await handsRef.current.close();
      handsRef.current = null;
    }
  };

  const toggleCamera = async () => {
    try {
      setIsSwitching(true);
      setIsCameraReady(false);
      
      await stopCurrentCamera();
      
      // Update camera index before setting up new camera
      setCurrentCameraIndex(prev => (prev + 1) % cameras.length);
      
      await setupCamera();
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera. Please try again.');
    } finally {
      setIsSwitching(false);
    }
  };

  const getCameraConstraints = () => {
    if (isIOS) {
      return {
        audio: false,
        video: {
          facingMode,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        }
      };
    }

    if (isAndroid) {
      return {
        audio: false,
        video: {
          mandatory: {
            facingMode,
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          }
        }
      };
    }

    // Desktop constraints
    return {
      audio: false,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode
      }
    };
  };

  const setupCamera = async () => {
    if (!isMounted.current) return;

    try {
      await stopCurrentCamera();
      setIsCameraReady(false);

      // First request basic camera access
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Then get available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);

      // Setup stream with proper device ID or fallback
      const deviceId = videoDevices[currentCameraIndex]?.deviceId;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: 1280,
          height: 720
        }
      });

      if (!isMounted.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
      }

      // Initialize hands after video is ready
      const hands = await initializeHands();
      await hands.initialize();
      
      if (!isMounted.current) {
        hands.close();
        return;
      }

      handsRef.current = hands;
      hands.onResults(onResults);

      // Start camera after hands is ready
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && isMounted.current && videoRef.current.readyState === 4) {
            try {
              await handsRef.current.send({ image: videoRef.current });
            } catch (err) {
              if (!err.message.includes('already deleted')) {
                console.error('Hand detection error:', err);
              }
            }
          }
        },
        width: 1280,
        height: 720
      });

      cameraRef.current = camera;
      await camera.start();
      setIsCameraReady(true);
    } catch (err) {
      console.error('Camera setup error:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Please grant camera permissions and try again'
          : 'Failed to initialize camera. Please try again.'
      );
      setIsCameraReady(false);
    }
  };

  // Update initialization useEffect
  useEffect(() => {
    isMounted.current = true;
    setupCamera();

    // Request permissions on mount
    navigator.mediaDevices.getUserMedia({ video: true })
      .catch(err => {
        console.error('Permission error:', err);
        setError('Camera permission is required');
      });

    return () => {
      isMounted.current = false;
      stopCurrentCamera();
    };
  }, []);

  useEffect(() => {
    loadNailImage(selectedDesign);
  }, [selectedDesign]); // Reload when design changes

  const onResults = (results) => {
    try {
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

      if (results.multiHandLandmarks && nailImageRef.current) {
        console.log('Drawing hand landmarks:', results.multiHandLandmarks.length, 'hands detected');
        
        for (const landmarks of results.multiHandLandmarks) {
          const fingertips = [4, 8, 12, 16, 20];
          fingertips.forEach(tipIndex => {
            const tip = landmarks[tipIndex];
            const x = tip.x * width;
            const y = tip.y * height;
            // Make nail size responsive to screen width
            const nailSize = Math.min(width * 0.3, 64); // 30% of screen width, max 64px

            // Draw debug point
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();

            // Draw nail image
            try {
              ctx.save();
              // Rotate image based on finger orientation
              const nextJoint = landmarks[tipIndex - 1];
              const angle = Math.atan2(
                nextJoint.y - tip.y,
                nextJoint.x - tip.x
              );
              
              ctx.translate(x, y);
              ctx.rotate(angle - Math.PI/2);
              // Adjust position to better align with fingertips
              ctx.drawImage(
                nailImageRef.current,
                -nailSize/2,
                -nailSize/2 - 20, // Offset upward slightly
                nailSize,
                nailSize
              );
              ctx.restore();
            } catch (err) {
              console.error('Error drawing nail:', err);
            }
          });
        }
      }
      ctx.restore();
    } catch (error) {
      console.error('Hand tracking error:', error);
      // Continue running but log the error
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        className="absolute w-full h-full object-cover"
        autoPlay
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute w-full h-full object-cover"
      />
      {!imageLoaded && (
        <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-yellow-500/80 text-white px-3 py-1 md:px-4 md:py-2 rounded text-sm md:text-base">
          Loading nail overlay...
        </div>
      )}
      
      {/* Responsive design buttons container */}
      <div className="absolute top-16 md:top-8 left-0 right-0 flex flex-wrap justify-center gap-2 px-4">
        {NAIL_DESIGNS.map((design) => (
          <button
            key={design.id}
            onClick={() => setSelectedDesign(design)}
            className={`px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-full transition-colors ${
              selectedDesign.id === design.id
                ? 'bg-pink-600 text-white'
                : 'bg-white/80 text-black hover:bg-pink-200'
            }`}
          >
            {design.name}
          </button>
        ))}
      </div>

      {/* Back button with responsive positioning */}
      <Link
        href="/"
        className="absolute top-2 left-2 md:top-8 md:left-8 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-white/80 text-black rounded-full hover:bg-white transition-colors"
      >
        ← Back
      </Link>

      {/* Bottom controls with responsive spacing */}
      <div className="absolute bottom-4 md:bottom-8 left-0 right-0 flex justify-center gap-4 px-4">
        <button 
          onClick={toggleCamera}
          disabled={!isCameraReady || isSwitching}
          className={`px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-full transition-colors ${
            isCameraReady && !isSwitching
              ? 'bg-pink-600 text-white hover:bg-pink-700'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {isSwitching ? 'Switching...' : isCameraReady ? 'Switch Camera' : 'Initializing...'}
        </button>
      </div>

      {error && (
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 bg-red-500/90 text-white px-4 py-3 rounded-lg text-center">
          {error}
          <button 
            onClick={() => {
              setError(null);
              setupCamera();
            }}
            className="block w-full mt-2 py-2 bg-white/20 rounded hover:bg-white/30"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
