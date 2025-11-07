import TryOnButton from './TryOnButton';

const HomePage = () => {
  return (
    <>
      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen bg-black overflow-hidden flex items-center pt-16">
        {/* Main Content */}
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center min-h-[100svh] pt-20 lg:pt-0 gap-12">
            {/* Left Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left pl-0 lg:pl-12">
              <p className="text-pink-500 text-base md:text-lg mb-2 animate-fade-in">VIRTUAL NAIL TRY-ON</p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-pink-400 animate-slide-up">CRAFTED FOR</span><br/>
                <span className="text-white animate-slide-up delay-100">PERFECTION</span>
              </h1>
              <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in delay-200">
                Experience virtual nail designs powered by artificial intelligence
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 animate-fade-in delay-300">
                <TryOnButton />
                <div className="text-pink-400">
                  For<br/>
                  <span className="text-2xl font-bold">FREE</span>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="w-full lg:w-1/2 h-[300px] md:h-[400px] lg:h-[600px] relative animate-fade-in delay-400">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl overflow-hidden 
                transform hover:scale-105 transition-transform duration-500">
                {/* Image placeholder */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="min-h-screen bg-zinc-950 flex items-center py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Popular Nail Designs
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Explore our trending nail art designs and find your perfect style
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Classic French', price: '$19.99' },
              { title: 'Glitter Dreams', price: '$24.99' },
              { title: 'Abstract Art', price: '$29.99' },
              { title: 'Floral Beauty', price: '$24.99' }
            ].map((product, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl bg-zinc-900 p-4">
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white">{product.title}</h3>
                  <p className="text-pink-500 font-medium">{product.price}</p>
                  <button className="mt-3 w-full rounded-full bg-pink-600 py-2 text-sm font-medium text-white hover:bg-pink-700 transition-colors">
                    Try Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Modern Layout */}
      <section id="features" className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center py-16 relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:3rem_3rem]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Experience <span className="text-pink-500">NailEdge AI</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Try on nail designs instantly with our advanced AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                title: 'Real-Time Preview',
                description: 'See designs on your nails instantly',
                icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
              },
              {
                title: 'Multiple Designs',
                description: 'Choose from various nail art styles',
                icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              },
              {
                title: 'Easy to Use',
                description: 'No special skills required',
                icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden rounded-3xl bg-white/[0.02] p-8 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-pink-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <div className="w-16 h-16 mb-6 bg-pink-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-500 transition-colors">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
            