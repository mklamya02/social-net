import React from 'react';

export const HeroImage = ({ isLoginView, onToggle }) => {
  return (
    <div className='w-full h-full relative overflow-hidden'>
      {/* Background Image */}
      <img
        src='https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2070&auto=format&fit=crop'
        alt="Abstract 3D shapes and colors"
        className="w-full h-full object-cover transition-transform duration-700 scale-105 opacity-60"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-blue-600/70 to-purple-800/80 dark:from-purple-500/70 dark:via-blue-500/60 dark:to-purple-700/70" />
      
      {/* Glassmorphism Overlay Content */}
      <div 
        className={`absolute top-0 h-full w-1/2 flex flex-col items-center justify-center text-center p-8 z-30 transition-transform duration-700 ease-in-out ${
          isLoginView ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl w-full max-w-sm mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            {isLoginView ? "New Here?" : "One of us?"}
          </h2>
          <p className="text-white/95 text-base md:text-lg mb-8 leading-relaxed drop-shadow-md">
            {isLoginView
              ? "Join us today and unlock amazing opportunities for your freelance career!"
              : "Welcome back! Sign in to continue your journey with us."}
          </p>
          <button
            onClick={onToggle}
            className="px-8 py-3.5 rounded-xl bg-white/20 backdrop-blur-md border-2 border-white/40 text-white font-semibold text-base transition-all duration-300 hover:bg-white hover:text-purple-700 hover:scale-105 hover:shadow-xl active:scale-95"
          >
            {isLoginView ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};
