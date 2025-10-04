'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/95 backdrop-blur-sm' : 'bg-black'
    }`}>
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-pink-500 z-50">NE</Link>
          
          <Link href="/" className={`absolute left-1/2 -translate-x-1/2 text-2xl font-bold transition-all duration-300 
            ${isMenuOpen ? 'opacity-0' : 'opacity-100'} hidden md:block`}>
            NAIL EDGE
          </Link>

          <div className="flex items-center space-x-6">
            {/* Desktop Icons */}
            <div className="hidden md:flex items-center space-x-6">
              <IconButton icon="search" />
              <IconButton icon="user" />
              <IconButton icon="cart" />
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden z-50 w-10 h-10 flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className={`w-6 h-6 relative transform transition-all duration-300 ${
                isMenuOpen ? 'rotate-180' : ''
              }`}>
                <span className={`absolute h-0.5 w-full bg-white transform transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
                }`}></span>
                <span className={`absolute h-0.5 w-full bg-white transform transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`absolute h-0.5 w-full bg-white transform transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
                }`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`fixed inset-0 bg-black transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}>
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <Link href="/" className="text-3xl text-white hover:text-pink-500">Home</Link>
            <Link href="/analyze" className="text-3xl text-white hover:text-pink-500">Analyze</Link>
            <Link href="/about" className="text-3xl text-white hover:text-pink-500">About</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const IconButton = ({ icon }) => {
  const icons = {
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    cart: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
  };

  return (
    <button className="hover:text-pink-500 transition-colors">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
      </svg>
    </button>
  );
};

export default Navbar;



