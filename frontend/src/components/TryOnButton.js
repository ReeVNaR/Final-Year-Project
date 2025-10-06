'use client'

const TryOnButton = () => {
  const handleClick = () => {
    window.location.href = '/try-on';
  };

  return (
    <button 
      onClick={handleClick}
      className="w-full sm:w-auto px-8 py-4 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-all hover:scale-105"
    >
      Try On Now
    </button>
  );
};

export default TryOnButton;
