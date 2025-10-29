'use client';

import Image from 'next/image';
import { useState } from 'react';

const nailDesigns = [
  { 
    id: 1, 
    name: 'Basic',
    image: '/nail.png'
  },
  { 
    id: 2, 
    name: 'French',
    image: '/french-nail.png'
  },
  { 
    id: 3, 
    name: 'Glitter',
    image: '/glitter-nail.png'
  }
];

export default function NailDesignPicker({ onSelectDesign, selectedDesign, onSizeChange, currentSize = 24 }) {
  const handleSizeChange = (delta) => {
    const newSize = Math.max(12, Math.min(48, currentSize + delta));
    onSizeChange?.(newSize);
  };

  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/80 p-4 rounded-r-xl backdrop-blur-sm">
      <div className="space-y-4">
        {nailDesigns.map((design) => (
          <button
            key={design.id}
            onClick={() => onSelectDesign(design)}
            className={`w-12 h-12 rounded-lg border-2 transition-all overflow-hidden ${
              selectedDesign?.id === design.id ? 'border-pink-500 scale-110' : 'border-white/20'
            }`}
          >
            <Image 
              src={design.image} 
              alt={design.name}
              className="w-full h-full object-contain"
              title={design.name}
              width={48}
              height={48}
              priority
            />
          </button>
        ))}
        
        {/* Size Controls */}
        <div className="pt-4 border-t border-white/20">
          <div className="flex justify-between items-center gap-2">
            <button
              onClick={() => handleSizeChange(-2)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
            >
              -
            </button>
            <span className="text-white text-xs">{currentSize}px</span>
            <button
              onClick={() => handleSizeChange(2)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

