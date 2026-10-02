import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'light', className = '' }) => {
  // Colors based on variant
  // Light variant (for white backgrounds): Dark Blue text, Red accents
  // Dark variant (for dark backgrounds): White text, Red accents
  const colors = {
    hand: variant === 'light' ? '#1e3a8a' : '#60a5fa', // Blue-900 or Blue-400
    heart: '#dc2626', // Red-600
    textPrimary: variant === 'light' ? 'text-blue-900' : 'text-white',
    textSecondary: 'text-red-600',
    textFoundation: variant === 'light' ? 'text-blue-900' : 'text-slate-300',
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Custom SVG Icon: Heart over Hand - Responsive Size */}
      <div className="relative w-9 h-9 sm:w-12 sm:h-12 flex-shrink-0 transition-all duration-300">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Hand Silhouette (Palm up) */}
          <path 
            d="M15,75 C15,75 35,95 50,95 C65,95 85,75 85,75 L85,65 C85,65 65,85 50,85 C35,85 15,65 15,65 L15,75 Z" 
            fill={colors.hand} 
          />
          <path 
             d="M85,65 L85,55 C85,55 95,50 95,65 C95,80 85,75 85,75" 
             fill={colors.hand} 
             opacity="0.8"
          />
           <path 
             d="M15,65 L15,55 C15,55 5,50 5,65 C5,80 15,75 15,75" 
             fill={colors.hand} 
             opacity="0.8"
          />

          {/* Heart Outline */}
          <path 
            d="M50 25 C62 10 90 20 90 45 C90 65 50 85 50 85 C50 85 10 65 10 45 C10 20 38 10 50 25 Z" 
            stroke={colors.heart} 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {/* Text Content */}
      <div className="flex flex-col leading-none">
        <div className="flex text-lg sm:text-2xl font-extrabold tracking-tight transition-all duration-300">
          <span className={colors.textPrimary}>CARDIO</span>
          <span className={colors.textSecondary}>CARE</span>
        </div>
        <span className={`text-[0.5rem] sm:text-[0.65rem] font-medium tracking-[0.2em] uppercase ${colors.textFoundation} ml-0.5`}>
          Foundation
        </span>
      </div>
    </div>
  );
};