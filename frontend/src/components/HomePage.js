'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import TryOnButton from './TryOnButton';
import FloatingParticles from './FloatingParticles';

// Animated counter hook
function useCounter(end, duration = 2000, startAnim = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startAnim) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [startAnim, end, duration]);
  return count;
}

const HomePage = () => {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px 50px 0px' }
    );
    document.querySelectorAll('[data-animate]').forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Parallax mouse tracking for hero
  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const isVisible = (id) => visibleSections.has(id);

  // Counter values
  const statsVisible = isVisible('stats');
  const usersCount = useCounter(50, 1800, statsVisible);
  const designsCount = useCounter(200, 1800, statsVisible);
  const accuracyCount = useCounter(99, 1500, statsVisible);
  const ratingCount = useCounter(49, 1800, statsVisible);

  const products = [
    { title: 'Classic French', price: '₹999', image: '/images/classic-french.png', tag: 'Bestseller' },
    { title: 'Glitter Dreams', price: '₹1,499', image: '/images/glitter-dreams.png', tag: 'Trending' },
    { title: 'Abstract Art', price: '₹1,999', image: '/images/abstract-art.png', tag: 'New' },
    { title: 'Floral Beauty', price: '₹1,499', image: '/images/floral-beauty.png', tag: 'Popular' },
  ];

  const features = [
    { title: 'Real-Time Preview', description: 'See nail designs on your hands instantly using your camera with zero lag or delay.', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { title: 'Multiple Designs', description: 'Browse through an extensive collection of nail art styles from classic to avant-garde.', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { title: 'Easy to Use', description: 'Simply point your camera and pick a design — no special skills or setup required.', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const steps = [
    { step: '01', title: 'Point Your Camera', description: 'Open the try-on tool and allow camera access. Our AI instantly detects your hands.', iconPath: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
    { step: '02', title: 'Choose a Design', description: 'Browse our curated collection and select the nail art that speaks to your style.', iconPath: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { step: '03', title: 'See the Magic', description: 'Watch as the nail design appears on your fingertips in real-time.', iconPath: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  ];

  const testimonials = [
    { name: 'Priya Sharma', role: 'Beauty Blogger, Mumbai', text: 'NailEdge AI is a game-changer! I can preview nail designs before committing — it saves me so much time and money.', rating: 5 },
    { name: 'Sneha Reddy', role: 'Nail Artist, Hyderabad', text: 'I use NailEdge with my clients to help them visualize designs. The real-time preview is incredibly accurate!', rating: 5 },
    { name: 'Ananya Verma', role: 'Fashion Enthusiast, Delhi', text: 'Love how easy it is to try different styles. The AI detection works flawlessly even on my phone.', rating: 5 },
  ];

  const marqueeItems = ['Classic French', '✦', 'Glitter Dreams', '✦', 'Abstract Art', '✦', 'Floral Beauty', '✦', 'Rose Gold', '✦', 'Marble Luxe', '✦', 'Chrome Nails', '✦', 'Ombré Pink', '✦'];

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section id="hero" ref={heroRef} className="relative min-h-screen bg-black overflow-hidden flex items-center pt-16">
        <FloatingParticles count={20} />
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-pink-600/[0.08] rounded-full blur-[150px] animate-glow-breathe" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }} />
          <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-purple-600/[0.08] rounded-full blur-[150px] animate-glow-breathe" style={{ animationDelay: '2s', transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)` }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-[0.03] animate-rotate-slow pointer-events-none"><div className="w-full h-full rounded-full border border-white" /></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-[0.02] pointer-events-none" style={{ animation: 'rotate-slow 40s linear infinite reverse' }}><div className="w-full h-full rounded-full border border-pink-500/50" /></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:80px_80px]" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent z-[5]" />
        </div>

        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center min-h-[100svh] pt-24 lg:pt-0 gap-10 lg:gap-16">
            <div className="w-full lg:w-1/2 text-center lg:text-left pl-0 lg:pl-8">
              <div className="inline-flex items-center gap-2.5 px-5 py-2 mb-8 rounded-full border border-pink-500/20 bg-pink-500/[0.06] animate-fade-in">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" /></span>
                <span className="text-pink-400 text-xs font-semibold tracking-[0.25em] uppercase">AI-Powered Try-On</span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4 leading-[0.95] tracking-tight">
                <span className="block overflow-hidden"><span className="block animate-slide-up gradient-text">CRAFTED</span></span>
                <span className="block overflow-hidden"><span className="block animate-slide-up delay-100 gradient-text">FOR</span></span>
                <span className="block overflow-hidden mt-1"><span className="text-white block animate-slide-up delay-200">PERFECTION</span></span>
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6 animate-fade-in delay-300">
                <div className="h-[1px] w-12 bg-gradient-to-r from-pink-500 to-transparent" />
                <span className="text-pink-500/50 text-xs tracking-[0.3em] uppercase font-light">Virtual Nail Studio</span>
              </div>
              <p className="text-gray-400 text-base md:text-lg mb-10 max-w-lg mx-auto lg:mx-0 animate-fade-in delay-400 leading-relaxed font-light">Experience virtual nail designs powered by AI. Preview stunning nail art in real-time — right from your camera.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 animate-fade-in delay-500">
                <TryOnButton />
                <button onClick={() => window.location.href = '/customize'} className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-full text-white text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">Customize Design</button>
              </div>
              <div className="mt-4 flex items-center justify-center lg:justify-start animate-fade-in delay-500">
                <div className="text-center sm:text-left"><span className="text-gray-600 text-[10px] block tracking-[0.2em] uppercase font-light">It&apos;s completely</span><span className="text-3xl font-extrabold gradient-text">FREE</span></div>
              </div>
              <div className="flex items-center justify-center lg:justify-start mt-16 animate-fade-in delay-700">
                {[{ val: '50K+', lbl: 'Users' }, { val: '200+', lbl: 'Designs' }, { val: '4.9★', lbl: 'Rating' }].map((s, i) => (
                  <div key={i} className="flex items-center">{i > 0 && <div className="w-[1px] h-8 bg-white/10 mx-8" />}<div className="text-center"><p className="text-white font-bold text-xl">{s.val}</p><p className="text-gray-600 text-[10px] uppercase tracking-[0.2em] mt-0.5">{s.lbl}</p></div></div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-1/2 h-[380px] md:h-[480px] lg:h-[620px] relative animate-fade-in delay-300" style={{ transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -8}px)` }}>
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-pink-500/20 blur-xl animate-glow-breathe" />
              <div className="absolute -inset-[2px] rounded-[2rem] bg-gradient-to-br from-pink-500/50 via-purple-500/30 to-pink-600/50" />
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden group bg-zinc-900">
                <Image src="/images/hero-nails.png" alt="Beautiful nail art showcase" fill className="object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out" priority sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
              </div>

            </div>
          </div>
        </div>

      </section>

      {/* ═══ MARQUEE STRIP ═══ */}
      <section className="relative bg-zinc-950 py-4 border-y border-white/[0.03] overflow-hidden">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className={`mx-6 text-sm font-light ${item === '✦' ? 'text-pink-500 text-xs' : 'text-gray-600 tracking-[0.15em] uppercase'}`}>{item}</span>
          ))}
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative bg-zinc-950 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.03),transparent_70%)]" />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
          <div id="stats" data-animate className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: `${usersCount}K+`, label: 'Happy Users' },
              { value: `${designsCount}+`, label: 'Nail Designs' },
              { value: `${accuracyCount}%`, label: 'Accuracy' },
              { value: `${(ratingCount / 10).toFixed(1)}`, label: 'App Rating' },
            ].map((stat, i) => (
              <div key={i} className={`text-center transition-all duration-1000 ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 200}ms` }}>
                <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-gray-600 text-xs uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ PRODUCTS ═══ */}
      < section id="products" className="min-h-screen bg-zinc-950 flex items-center py-24 relative overflow-hidden" >
        <div className="absolute top-0 left-1/3 w-72 h-72 bg-pink-500/[0.03] rounded-full blur-[150px]" />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div id="ph" data-animate className="text-center mb-20">
            <span className={`inline-block text-pink-500/80 text-xs font-medium tracking-[0.3em] uppercase mb-4 transition-all duration-700 ${isVisible('ph') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Our Collection</span>
            <h2 className={`text-3xl md:text-5xl font-bold text-white mb-4 transition-all duration-700 delay-100 ${isVisible('ph') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Popular Nail <span className="gradient-text">Designs</span></h2>
            <p className={`text-gray-500 max-w-xl mx-auto transition-all duration-700 delay-200 ${isVisible('ph') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Explore our trending nail art designs and find your perfect style</p>
          </div>
          <div id="pg" data-animate className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <div key={i} className={`group relative overflow-hidden rounded-3xl bg-zinc-900/60 border border-white/[0.04] tilt-card animated-border hover-lift ${isVisible('pg') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`} style={{ transitionDelay: `${i * 150}ms`, transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}>
                <div className="absolute top-4 right-4 z-20"><span className="px-3 py-1 text-[10px] font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full uppercase tracking-wider">{p.tag}</span></div>
                <div className="aspect-square w-full overflow-hidden relative">
                  <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-70" />
                </div>
                <div className="p-5 tilt-inner">
                  <h3 className="text-lg font-semibold text-white group-hover:text-pink-400 transition-colors duration-500">{p.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="gradient-text font-bold text-lg">{p.price}</p>
                    <div className="flex gap-0.5">{[...Array(5)].map((_, j) => (<svg key={j} className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}</div>
                  </div>
                  <button onClick={() => window.location.href = '/try-on'} className="mt-4 w-full rounded-full bg-gradient-to-r from-pink-600 to-purple-600 py-2.5 text-sm font-medium text-white hover:from-pink-500 hover:to-purple-500 transition-all duration-500 hover:shadow-lg hover:shadow-pink-500/20 magnetic-btn">Try On Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ HOW IT WORKS ═══ */}
      < section id="how-it-works" className="relative py-28 bg-black overflow-hidden noise-overlay" >
        <FloatingParticles count={15} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div id="hh" data-animate className="text-center mb-20">
            <span className={`inline-block text-pink-500/80 text-xs font-medium tracking-[0.3em] uppercase mb-4 transition-all duration-700 ${isVisible('hh') ? 'opacity-100' : 'opacity-0'}`}>Simple Process</span>
            <h2 className={`text-3xl md:text-5xl font-bold text-white mb-4 transition-all duration-700 delay-100 ${isVisible('hh') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>How It <span className="gradient-text">Works</span></h2>
          </div>
          <div id="hs" data-animate className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((item, i) => (
              <div key={i} className={`relative group transition-all duration-700 ${isVisible('hs') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`} style={{ transitionDelay: `${i * 250}ms` }}>
                {i < 2 && <div className="hidden md:block absolute top-14 left-[calc(50%+60px)] w-[calc(100%-60px)] h-[1px] bg-gradient-to-r from-pink-500/20 to-transparent" />}
                <div className="relative text-center p-8 rounded-3xl glass hover:bg-white/[0.03] transition-all duration-700 hover:-translate-y-3 animated-border">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-6xl font-black text-white/[0.03] select-none">{item.step}</div>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-500/15 to-purple-500/15 flex items-center justify-center text-pink-400 group-hover:scale-110 group-hover:from-pink-500/25 group-hover:to-purple-500/25 transition-all duration-700">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconPath} /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-400 transition-colors duration-500">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div id="hc" data-animate className={`text-center mt-16 transition-all duration-700 delay-500 ${isVisible('hc') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}><TryOnButton /></div>
        </div>
      </section >

      {/* ═══ FEATURES ═══ */}
      < section id="features" className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center py-24 relative overflow-hidden" >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(236,72,153,0.04),transparent_60%)]" />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
          <div id="fh" data-animate className="text-center mb-16">
            <span className={`inline-block text-pink-500/80 text-xs font-medium tracking-[0.3em] uppercase mb-4 transition-all duration-700 ${isVisible('fh') ? 'opacity-100' : 'opacity-0'}`}>Why Choose Us</span>
            <h2 className={`text-3xl md:text-5xl font-bold text-white mb-4 transition-all duration-700 delay-100 ${isVisible('fh') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Experience <span className="gradient-text">NailEdge AI</span></h2>
          </div>
          <div id="fg" data-animate className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className={`group relative overflow-hidden rounded-3xl glass p-8 hover:bg-white/[0.04] transition-all duration-700 hover:-translate-y-3 animated-border ${isVisible('fg') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`} style={{ transitionDelay: `${i * 250}ms` }}>
                <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-pink-500/15 to-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:from-pink-500/25 transition-all duration-500">
                  <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-400 transition-colors duration-500">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ TESTIMONIALS ═══ */}
      < section id="testimonials" className="relative py-28 bg-black overflow-hidden" >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/15 to-transparent" />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div id="th" data-animate className="text-center mb-16">
            <span className={`inline-block text-pink-500/80 text-xs font-medium tracking-[0.3em] uppercase mb-4 transition-all duration-700 ${isVisible('th') ? 'opacity-100' : 'opacity-0'}`}>Testimonials</span>
            <h2 className={`text-3xl md:text-5xl font-bold text-white mb-4 transition-all duration-700 delay-100 ${isVisible('th') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>What Our Users <span className="gradient-text">Say</span></h2>
          </div>
          <div id="tg" data-animate className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className={`relative group rounded-3xl glass p-8 hover:bg-white/[0.03] transition-all duration-700 hover:-translate-y-3 animated-border ${isVisible('tg') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`} style={{ transitionDelay: `${i * 250}ms` }}>
                <div className="absolute top-4 right-6 text-5xl font-serif text-pink-500/[0.06] select-none">&ldquo;</div>
                <div className="flex gap-1 mb-4">{[...Array(t.rating)].map((_, j) => (<svg key={j} className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}</div>
                <p className="text-gray-400 mb-6 leading-relaxed italic text-sm">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center"><span className="text-white font-bold text-sm">{t.name[0]}</span></div>
                  <div><p className="text-white font-semibold text-sm">{t.name}</p><p className="text-gray-600 text-xs">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ CTA BANNER ═══ */}
      < section className="relative py-28 overflow-hidden" >
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 via-purple-600/15 to-pink-600/10 animate-gradient" />
        <div className="absolute inset-0 bg-black/50" />
        <FloatingParticles count={12} />
        <div id="cta" data-animate className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10 text-center">
          <h2 className={`text-3xl md:text-5xl font-bold text-white mb-6 transition-all duration-700 ${isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>Ready to Find Your Perfect Nails?</h2>
          <p className={`text-gray-400 text-lg mb-10 max-w-2xl mx-auto transition-all duration-700 delay-200 ${isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>Try on hundreds of nail designs for free. No downloads required.</p>
          <div className={`transition-all duration-700 delay-400 ${isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button onClick={() => window.location.href = '/try-on'} className="px-12 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full text-lg font-semibold hover:from-pink-500 hover:to-purple-500 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 animate-pulse-glow magnetic-btn">Start Free Try-On →</button>
          </div>
        </div>
      </section >

      {/* ═══ FOOTER ═══ */}
      < footer className="relative bg-zinc-950 pt-20 pb-8 border-t border-white/[0.04]" >
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">NailEdge <span className="gradient-text">AI</span></h3>
              <p className="text-gray-500 max-w-sm leading-relaxed mb-6 text-sm">The future of nail art is here. Try on stunning designs with our AI-powered virtual try-on platform.</p>
              <div className="flex gap-3">
                {[{ l: 'Instagram', p: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z' }, { l: 'Twitter', p: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' }, { l: 'YouTube', p: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33zM9.75 15.02V8.5l5.75 3.27-5.75 3.25z' }].map((s, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-gray-500 hover:text-pink-400 hover:border-pink-500/30 transition-all duration-500" aria-label={s.l}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.p} /></svg></a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-[0.2em]">Quick Links</h4>
              <ul className="space-y-3">{['Home', 'Products', 'Features', 'Try On'].map((l, i) => (<li key={i}><button onClick={() => l === 'Try On' ? (window.location.href = '/try-on') : document.getElementById(l.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-500 hover:text-pink-400 transition-colors text-sm">{l}</button></li>))}</ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-[0.2em]">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-500 text-sm"><svg className="w-4 h-4 text-pink-500/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>hello@nailedge.ai</li>
                <li className="flex items-center gap-2 text-gray-500 text-sm"><svg className="w-4 h-4 text-pink-500/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Mumbai, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs tracking-wider">© 2026 NailEdge AI. All rights reserved.</p>
            <div className="flex gap-6">{['Privacy Policy', 'Terms of Service'].map((t, i) => (<a key={i} href="#" className="text-gray-600 hover:text-pink-400 text-xs transition-colors">{t}</a>))}</div>
          </div>
        </div>
      </footer >
    </>
  );
};

export default HomePage;