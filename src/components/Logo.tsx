import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32, showWordmark = true }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Modern Geometric SVG Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform transition-transform hover:scale-105 duration-300"
      >
        {/* Core background loop (representing portal / connections) */}
        <path
          d="M20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35C28.2843 35 35 28.2843 35 20"
          stroke="url(#logo-grad-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Overlapping dynamic accent arrow representing progression and antigravity/lift */}
        <path
          d="M13 22L20 15L27 22"
          stroke="url(#logo-grad-accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 15V29"
          stroke="url(#logo-grad-accent)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Glow point */}
        <circle cx="20" cy="15" r="2.5" fill="#14b8a6" className="animate-ping" style={{ transformOrigin: '20px 15px' }} />
        <circle cx="20" cy="15" r="1.5" fill="#14b8a6" />

        <defs>
          <linearGradient id="logo-grad-primary" x1="5" y1="5" x2="35" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="logo-grad-accent" x1="13" y1="15" x2="27" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14b8a6" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      
      {showWordmark && (
        <span 
          className="font-display font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-white dark:to-slate-200"
          style={{ fontSize: `${Math.max(14, size * 0.52)}px`, lineHeight: 1 }}
        >
          TPO<span className="text-blue-600 dark:text-blue-500 font-medium">Helper</span>
        </span>
      )}
    </div>
  );
};
