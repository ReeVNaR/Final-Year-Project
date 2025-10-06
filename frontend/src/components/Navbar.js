'use client';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
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

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/90' : 'bg-black/80'} backdrop-blur-sm border-b border-white/10`}>
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div 
            onClick={() => scrollToSection('hero')} 
            className="text-xl font-bold text-white cursor-pointer hover:text-pink-500 transition-colors"
          >
            NailEdge AI
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('hero')} className="text-gray-300 hover:text-pink-500 transition-colors">Home</button>
            <button onClick={() => scrollToSection('products')} className="text-gray-300 hover:text-pink-500 transition-colors">Products</button>
            <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-pink-500 transition-colors">Features</button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-pink-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="py-4 space-y-4">
            <button onClick={() => scrollToSection('hero')} className="block w-full text-left text-gray-300 hover:text-pink-500 transition-colors">Home</button>
            <button onClick={() => scrollToSection('products')} className="block w-full text-left text-gray-300 hover:text-pink-500 transition-colors">Products</button>
            <button onClick={() => scrollToSection('features')} className="block w-full text-left text-gray-300 hover:text-pink-500 transition-colors">Features</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;




