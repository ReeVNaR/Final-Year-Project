'use client';
import React from 'react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import autoprefixer from 'autoprefixer';

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
  const [nailSize, setNailSize] = useState(62); // Increased from 32 to 48

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
    return {
      audio: false,
      video: {
        facingMode: facingMode,
      }
    };
  };

  const setupCamera = async () => {
    if (!isMounted.current) return;

    try {
      await stopCurrentCamera();
      setIsCameraReady(false);

      const constraints = getCameraConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!isMounted.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            
            if (canvasRef.current) {
              canvasRef.current.width = settings.width;
              canvasRef.current.height = settings.height;
            }
            resolve();
          };
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
        }
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

  const handleNailSizeChange = (delta) => {
    setNailSize(prev => Math.max(24, Math.min(96, prev + delta))); // Increased min/max limits
  };

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
        for (const [index, landmarks] of results.multiHandLandmarks.entries()) {
          // Get hand information
          const handedness = results.multiHandedness[index].label;
          
          // Reference points for palm orientation
          const wrist = landmarks[0];
          const thumb = landmarks[4];
          const index_tip = landmarks[8];
          const middle = landmarks[12];
          const pinky = landmarks[20];

          // Calculate palm normal vector using cross product
          const palm_vector1 = {
            x: middle.x - wrist.x,
            y: middle.y - wrist.y,
            z: middle.z - wrist.z
          };

          const palm_vector2 = {
            x: pinky.x - index_tip.x,
            y: pinky.y - index_tip.y,
            z: pinky.z - index_tip.z
          };

          // Cross product to get palm normal
          const palm_normal = {
            x: (palm_vector1.y * palm_vector2.z) - (palm_vector1.z * palm_vector2.y),
            y: (palm_vector1.z * palm_vector2.x) - (palm_vector1.x * palm_vector2.z),
            z: (palm_vector1.x * palm_vector2.y) - (palm_vector1.y * palm_vector2.x)
          };

          // Check if palm is facing camera (negative z means facing camera)
          const isPalmAway = handedness === 'Left' ? palm_normal.z > 0 : palm_normal.z < 0;

          if (isPalmAway) {
            const fingertips = [4, 8, 12, 16, 20];
            fingertips.forEach(tipIndex => {
              const tip = landmarks[tipIndex];
              const x = tip.x * width;
              const y = tip.y * height;
              
              const nextJoint = landmarks[tipIndex - 1];
              const jointX = nextJoint.x * width;
              const jointY = nextJoint.y * height;
              const fingerWidth = Math.sqrt(
                Math.pow(x - jointX, 2) + Math.pow(y - jointY, 2)
              );
              
              const currentNailSize = Math.min(fingerWidth * 1.2, nailSize);

              try {
                ctx.save();
                const angle = Math.atan2(
                  nextJoint.y - tip.y,
                  nextJoint.x - tip.x
                );
                
                ctx.translate(x, y);
                ctx.rotate(angle - Math.PI/2);
                ctx.drawImage(
                  nailImageRef.current,
                  -currentNailSize/2,
                  -currentNailSize/2 - currentNailSize * 0.2,
                  currentNailSize,
                  currentNailSize
                );
                ctx.restore();
              } catch (err) {
                console.error('Error drawing nail:', err);
              }
            });
          }
        }
      }
      ctx.restore();
    } catch (error) {
      console.error('Hand tracking error:', error);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          className="absolute w-full h-full object-cover bg-black"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute w-full h-full object-cover"
        />
      </div>
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

      {/* Size control buttons */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button
          onClick={() => handleNailSizeChange(2)}
          className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30"
        >
          +
        </button>
        <button
          onClick={() => handleNailSizeChange(-2)}
          className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30"
        >
          -
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
    
      
