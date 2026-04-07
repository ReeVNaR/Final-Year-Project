import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function NailDesignCustomizer({ onApply, onClose }) {
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const [designImage, setDesignImage] = useState(null);
  const [baseImage, setBaseImage] = useState(null);
  const [maskReady, setMaskReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [designOffset, setDesignOffset] = useState({ x: 0, y: 0 });
  const [designScale, setDesignScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showUploadHint, setShowUploadHint] = useState(true);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastOffsetRef = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef(null);

  // Nail shape dimensions (will be computed from the mask)
  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 700;

  // Load the original nail image and create a mask from it
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/images/nail-original.png';
    img.onload = () => {
      // Create a hidden canvas to extract the nail mask
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = CANVAS_WIDTH;
      maskCanvas.height = CANVAS_HEIGHT;
      const maskCtx = maskCanvas.getContext('2d');

      // Draw the original image
      maskCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Get pixel data and create a mask - the nail area is bright (white/light)
      // while the background is dark (black)
      const imageData = maskCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        // If brightness is above threshold, it's the nail area (make it opaque white)
        // Otherwise it's background (make it transparent)
        if (brightness > 60) {
          data[i] = 255;     // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
          data[i + 3] = 255; // A — fully opaque
        } else {
          data[i] = 0;       // R
          data[i + 1] = 0;   // G
          data[i + 2] = 0;   // B
          data[i + 3] = 0;   // A — fully transparent
        }
      }

      maskCtx.putImageData(imageData, 0, 0);
      maskCanvasRef.current = maskCanvas;
      setMaskReady(true);
    };

    // Also load the clean base image
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = '/images/nail-base.png';
    baseImg.onload = () => {
      setBaseImage(baseImg);
    };
  }, []);

  // Render the composite
  const renderComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maskReady) return;

    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (designImage) {
      // Step 1: Draw the mask shape first
      ctx.drawImage(maskCanvasRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Step 2: Use 'source-in' to clip the design to the nail shape
      ctx.globalCompositeOperation = 'source-in';

      // Calculate design dimensions to cover the nail area
      const scale = designScale;
      const dw = CANVAS_WIDTH * scale;
      const dh = CANVAS_HEIGHT * scale;
      const dx = (CANVAS_WIDTH - dw) / 2 + designOffset.x;
      const dy = (CANVAS_HEIGHT - dh) / 2 + designOffset.y;

      ctx.drawImage(designImage, dx, dy, dw, dh);

      // Step 3: Draw the base nail on top for 3D/glossy effect with 'source-atop'
      ctx.globalCompositeOperation = 'source-atop';
      if (baseImage) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(baseImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.globalAlpha = 1;
      }

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      // Step 4: Add subtle glossy highlight overlay
      const gradient = ctx.createLinearGradient(CANVAS_WIDTH * 0.3, 0, CANVAS_WIDTH * 0.7, CANVAS_HEIGHT);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');

      // Draw the highlight only within the nail shape
      ctx.save();
      // Create a clipping path from the mask
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = CANVAS_WIDTH;
      tempCanvas.height = CANVAS_HEIGHT;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(maskCanvasRef.current, 0, 0);
      tempCtx.globalCompositeOperation = 'source-in';
      tempCtx.fillStyle = gradient;
      tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();
    } else if (baseImage) {
      // No design uploaded yet — show the clean base nail
      // First draw the mask
      ctx.drawImage(maskCanvasRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(baseImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [designImage, baseImage, maskReady, designOffset, designScale]);

  // Re-render whenever dependencies change
  useEffect(() => {
    renderComposite();
  }, [renderComposite]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);
    setShowUploadHint(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setDesignImage(img);
        setDesignOffset({ x: 0, y: 0 });
        setDesignScale(1);
        setIsProcessing(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle drag to reposition the design
  const handlePointerDown = (e) => {
    if (!designImage) return;
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    lastOffsetRef.current = { ...designOffset };
  };

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleFactorX = CANVAS_WIDTH / rect.width;
      const scaleFactorY = CANVAS_HEIGHT / rect.height;
      const dx = (e.clientX - rect.left - dragStartRef.current.x) * scaleFactorX;
      const dy = (e.clientY - rect.top - dragStartRef.current.y) * scaleFactorY;
      setDesignOffset({
        x: lastOffsetRef.current.x + dx,
        y: lastOffsetRef.current.y + dy,
      });
    },
    [isDragging]
  );

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Handle zoom via scroll wheel
  const handleWheel = (e) => {
    if (!designImage) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setDesignScale((prev) => Math.max(0.3, Math.min(3, prev + delta)));
  };

  // Download the result
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `nailedge-custom-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Try on the custom design
  const handleTryOn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Save the customized design as a data URL to local storage so the TryOn page can access it
    const dataUrl = canvas.toDataURL('image/png');
    
    try {
      // Create a unique ID for this custom design
      const customDesignId = 'custom_' + Date.now();
      
      // Save it state-wide or via callback
      if (onApply) {
        onApply(dataUrl, customDesignId);
      }
    } catch (e) {
      console.error("Failed to apply custom design:", e);
      alert("Image is too large to process. Try rendering the image smaller or downloading it.");
    }
  };

  // Reset design
  const handleReset = () => {
    setDesignImage(null);
    setDesignOffset({ x: 0, y: 0 });
    setDesignScale(1);
    setFileName('');
    setShowUploadHint(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 text-white overflow-hidden flex flex-col">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-pink-500/5 blur-[120px] animate-glow-breathe" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-purple-500/5 blur-[120px] animate-glow-breathe delay-500" />
      </div>

      {/* Top bar */}
      <div className="relative z-20 safe-top">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white text-sm font-medium hover:bg-white/10 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Close</span>
          </button>

          <h1 className="text-sm sm:text-base font-semibold tracking-wide">
            <span className="gradient-text">Nail Design Studio</span>
          </h1>

          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 px-4 sm:px-6 pb-8 pt-2 max-w-7xl mx-auto">
        {/* Left — Canvas Preview */}
        <div className="relative flex-shrink-0">
          {/* Glow behind the nail */}
          <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 blur-3xl animate-glow-breathe" />

          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
            {/* Canvas container */}
            <div
              className="relative cursor-move select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onWheel={handleWheel}
              style={{ touchAction: 'none' }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-[260px] h-[364px] sm:w-[320px] sm:h-[448px] md:w-[380px] md:h-[532px] rounded-2xl"
                style={{ imageRendering: 'auto' }}
              />

              {/* Upload hint overlay */}
              {showUploadHint && !designImage && maskReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl">
                  <div className="text-center animate-fade-in">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-pink-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-white/50 text-xs sm:text-sm">Upload a design to preview</p>
                  </div>
                </div>
              )}

              {/* Loading spinner */}
              {(!maskReady || isProcessing) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                    <p className="text-white/60 text-xs">{isProcessing ? 'Applying design...' : 'Loading nail...'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Design info bar */}
            {designImage && (
              <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                <span className="truncate max-w-[180px]">{fileName}</span>
                <span>Scale: {Math.round(designScale * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Right — Controls */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Upload Section */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Design
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="design-upload"
            />

            <label
              htmlFor="design-upload"
              className="group flex flex-col items-center justify-center w-full h-32 sm:h-36 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-pink-500/40 hover:bg-pink-500/5 transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-pink-500/10 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-white/40 group-hover:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/60 text-xs sm:text-sm font-medium">Click to upload</p>
                  <p className="text-white/30 text-[10px] sm:text-xs mt-0.5">PNG, JPG, WEBP supported</p>
                </div>
              </div>
            </label>
          </div>

          {/* Adjustment Controls — shown when design is loaded */}
          {designImage && (
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 animate-fade-in">
              <h2 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Adjust Design
              </h2>

              {/* Scale slider */}
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                  <span>Scale</span>
                  <span>{Math.round(designScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  value={Math.round(designScale * 100)}
                  onChange={(e) => setDesignScale(Number(e.target.value) / 100)}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-gradient-to-r
                    [&::-webkit-slider-thumb]:from-pink-500
                    [&::-webkit-slider-thumb]:to-purple-500
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-pink-500/30
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-gradient-to-r
                    [&::-moz-range-thumb]:from-pink-500
                    [&::-moz-range-thumb]:to-purple-500
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>

              {/* Position hint */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-[11px] text-white/40">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Drag on the nail to reposition your design</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {designImage && (
              <>
                <button
                  onClick={handleTryOn}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-sm font-semibold hover:from-pink-500 hover:to-purple-500 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/20"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Try On This Design
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-[0.98] transition-all"
                    title="Reset Design"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tips section */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">Tips</h3>
            <ul className="space-y-2.5 text-[11px] sm:text-xs text-white/40">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-pink-500 mt-1.5 flex-shrink-0" />
                Upload any pattern, artwork, or nail design image
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                Drag on the preview to reposition the design
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-pink-500 mt-1.5 flex-shrink-0" />
                Use the scale slider or scroll wheel to resize
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                Download your customized nail design as PNG
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
