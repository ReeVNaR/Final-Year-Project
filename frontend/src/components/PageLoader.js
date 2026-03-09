'use client';
import { useEffect, useState } from 'react';

export default function PageLoader() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 2200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`page-loader ${loaded ? 'loaded' : ''}`}>
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </div>
                </div>
                <p className="text-white/40 text-xs tracking-[0.3em] uppercase font-light">NailEdge AI</p>
                <div className="loader-bar" />
            </div>
        </div>
    );
}
