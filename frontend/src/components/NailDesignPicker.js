'use client';

import Image from 'next/image';

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

export default function NailDesignPicker({ onSelectDesign, selectedDesign }) {
  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/80 p-4 rounded-r-xl backdrop-blur-sm">
      <div className="space-y-4">
        {nailDesigns.map((design) => (
          <button
            key={design.id}
            onClick={() => onSelectDesign(design)}
            className={`w-16 h-16 rounded-lg border-2 transition-all overflow-hidden ${
              selectedDesign?.id === design.id ? 'border-pink-500 scale-110' : 'border-white/20'
            }`}
          >
            <Image 
              src={design.image} 
              alt={design.name}
              className="w-full h-full object-cover"
              title={design.name}
              width={64}
              height={64}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

