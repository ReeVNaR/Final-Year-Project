'use client';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Track active section
      const sections = ['hero', 'products', 'how-it-works', 'features', 'testimonials'];
      for (const section of sections.reverse()) {
        const el = document.getElementById(section);
        if (el && window.scrollY >= el.offsetTop - 200) {
          setActiveSection(section);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setIsMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'Home', id: 'hero' },
    { label: 'Designs', id: 'products' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Features', id: 'features' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled
        ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
        : 'bg-transparent'
      }`}>
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 md:h-18 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => scrollToSection('hero')}
            className="group flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white group-hover:text-pink-400 transition-colors duration-300">
              NailEdge <span className="text-pink-500">AI</span>
            </span>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${activeSection === link.id
                    ? 'text-pink-400'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500" />
                )}
              </button>
            ))}
            <button
              onClick={() => window.location.href = '/try-on?custom=new'}
              className="ml-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium rounded-full hover:from-purple-500 hover:to-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105"
            >
              Custom Design
            </button>
            <button
              onClick={() => window.location.href = '/try-on'}
              className="ml-4 px-5 py-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white text-sm font-medium rounded-full hover:from-pink-500 hover:to-pink-600 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/25 hover:scale-105"
            >
              Try On Free
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl glass text-gray-300 hover:text-pink-500 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 relative flex flex-col justify-between">
              <span className={`w-full h-[2px] bg-current rounded transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`w-full h-[2px] bg-current rounded transition-all duration-300 ${isMenuOpen ? 'opacity-0 scale-0' : ''}`} />
              <span className={`w-full h-[2px] bg-current rounded transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'max-h-80 opacity-100 pb-6' : 'max-h-0 opacity-0'
          } overflow-hidden`}>
          <div className="space-y-1 pt-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeSection === link.id
                    ? 'text-pink-400 bg-pink-500/10'
                    : 'text-gray-300 hover:text-pink-400 hover:bg-white/5'
                  }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => { setIsMenuOpen(false); window.location.href = '/try-on?custom=new'; }}
              className="block w-full px-4 py-3 mt-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium rounded-xl text-center hover:from-purple-500 hover:to-purple-600 transition-all"
            >
              Custom Design
            </button>
            <button
              onClick={() => { setIsMenuOpen(false); window.location.href = '/try-on'; }}
              className="block w-full px-4 py-3 mt-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white text-sm font-medium rounded-xl text-center hover:from-pink-500 hover:to-pink-600 transition-all"
            >
              Try On Free →
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
