'use client';
import { useMemo } from 'react';

export default function FloatingParticles({ count = 30 }) {
    const particles = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: Math.random() * 3 + 1,
            delay: Math.random() * 20,
            duration: Math.random() * 15 + 15,
            opacity: Math.random() * 0.4 + 0.1,
            color: Math.random() > 0.5 ? 'rgba(236,72,153,' : 'rgba(168,85,247,',
        })), [count]
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        left: `${p.left}%`,
                        bottom: '-10px',
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        background: `${p.color}${p.opacity})`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}0.3)`,
                    }}
                />
            ))}
        </div>
    );
}
