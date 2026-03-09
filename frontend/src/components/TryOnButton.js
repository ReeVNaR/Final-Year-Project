'use client'
import { useRef } from 'react';

const TryOnButton = () => {
  const btnRef = useRef(null);

  const handleClick = (e) => {
    // Ripple effect
    const btn = btnRef.current;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    ripple.className = 'ripple';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
    setTimeout(() => { window.location.href = '/try-on'; }, 400);
  };

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className="group relative w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full font-semibold text-lg overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/25 magnetic-btn ripple-container animate-pulse-glow"
    >
      {/* Shimmer sweep */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
      {/* Border glow */}
      <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)' }} />
      <span className="relative flex items-center justify-center gap-2">
        Try On Now
        <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </span>
    </button>
  );
};

export default TryOnButton;
