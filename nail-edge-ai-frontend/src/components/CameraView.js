'use client';
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

export default function CameraView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const nailImageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [nailImages, setNailImages] = useState({});
  const [selectedDesign, setSelectedDesign] = useState(NAIL_DESIGNS[0]);
  const [facingMode, setFacingMode] = useState('environment');
  const cameraRef = useRef(null);

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

  const toggleCamera = async () => {
    // Stop current camera
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    // Toggle facing mode
    setFacingMode(current => current === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            facingMode: facingMode
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              await hands.send({ image: videoRef.current });
            },
            width: 1280,
            height: 720
          });
          cameraRef.current = camera;
          camera.start();
        }
      } catch (err) {
        setError('Camera access denied. Please enable camera permissions.');
        console.error('Error accessing camera:', err);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [facingMode]); // Re-run when facing mode changes

  useEffect(() => {
    loadNailImage(selectedDesign);
  }, [selectedDesign]); // Reload when design changes

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

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
          className="px-4 py-2 md:px-6 md:py-3 text-sm md:text-base bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors"
        >
          Switch Camera
        </button>
      </div>
    </div>
  );
}
