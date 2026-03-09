'use client';
import { useEffect, useRef } from 'react';

export default function CustomCursor() {
    const cursorRef = useRef(null);
    const dotRef = useRef(null);
    const glowRef = useRef(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        const dot = dotRef.current;
        const glow = glowRef.current;
        let mx = 0, my = 0, cx = 0, cy = 0;

        const move = (e) => {
            mx = e.clientX;
            my = e.clientY;
            if (dot) { dot.style.left = mx + 'px'; dot.style.top = my + 'px'; }
            if (glow) { glow.style.left = mx + 'px'; glow.style.top = my + 'px'; }
        };

        const lerp = () => {
            cx += (mx - cx) * 0.12;
            cy += (my - cy) * 0.12;
            if (cursor) { cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px'; }
            requestAnimationFrame(lerp);
        };

        const addHover = () => cursor?.classList.add('hovering');
        const removeHover = () => cursor?.classList.remove('hovering');

        document.addEventListener('mousemove', move);
        lerp();

        const interactives = document.querySelectorAll('button, a, [role="button"]');
        interactives.forEach(el => {
            el.addEventListener('mouseenter', addHover);
            el.addEventListener('mouseleave', removeHover);
        });

        const obs = new MutationObserver(() => {
            document.querySelectorAll('button, a, [role="button"]').forEach(el => {
                el.addEventListener('mouseenter', addHover);
                el.addEventListener('mouseleave', removeHover);
            });
        });
        obs.observe(document.body, { childList: true, subtree: true });

        return () => {
            document.removeEventListener('mousemove', move);
            obs.disconnect();
        };
    }, []);

    return (
        <>
            <div ref={cursorRef} className="custom-cursor hidden md:block" />
            <div ref={dotRef} className="cursor-dot hidden md:block" />
            <div ref={glowRef} className="cursor-glow hidden md:block" />
        </>
    );
}
