import React from 'react';

interface SafrSaathiLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'stacked' | 'icon' | 'badge';
  dark?: boolean;
}

export const SafrSaathiLogo: React.FC<SafrSaathiLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'horizontal',
  dark = false,
}) => {
  // SVG Icon representing the Shield + Bus + Arrow + Sparkles from the official SafrSaathi emblem
  const EmblemIcon = ({ iconSize = 40 }: { iconSize?: number }) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
    >
      {/* Background soft circle if badge */}
      {variant === 'badge' && (
        <circle cx="100" cy="100" r="96" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
      )}

      <g transform="translate(10, 8)">
        {/* Shield Frame Outer Shape */}
        {/* Navy Left & Center Section */}
        <path
          d="M90 12 L24 38 C24 88 48 132 90 156 C90 156 50 125 44 80 L90 28 Z"
          fill="#1B365D"
        />
        {/* Orange Top-Right Shield Arc */}
        <path
          d="M90 12 L156 38 C156 65 148 95 130 118 L118 106 C134 86 140 62 140 42 L90 22 Z"
          fill="#E87722"
        />
        {/* Teal Bottom Point */}
        <path
          d="M90 156 C115 142 135 120 146 96 L132 88 C122 108 106 126 90 138 Z"
          fill="#009688"
        />

        {/* 4 Sparkle Stars above bus */}
        {/* Star 1 */}
        <path
          d="M48 54 C48 50 51 47 55 47 C51 47 48 44 48 40 C48 44 45 47 41 47 C45 47 48 50 48 54 Z"
          fill="#00A896"
        />
        {/* Star 2 */}
        <path
          d="M72 40 C72 34 76 30 82 30 C76 30 72 26 72 20 C72 26 68 30 62 30 C68 30 72 34 72 40 Z"
          fill="#00A896"
        />
        {/* Star 3 (Central Top) */}
        <path
          d="M102 34 C102 27 107 22 114 22 C107 22 102 17 102 10 C102 17 97 22 90 22 C97 22 102 27 102 34 Z"
          fill="#14919B"
        />
        {/* Star 4 */}
        <path
          d="M126 44 C126 39 129 36 134 36 C129 36 126 33 126 28 C126 33 123 36 118 36 C123 36 126 39 126 44 Z"
          fill="#E87722"
        />

        {/* Modern Stylized PRTC Bus Graphic */}
        {/* Bus Body */}
        <path
          d="M26 86 L118 56 C134 51 146 59 152 74 L158 98 C160 108 154 116 142 118 L126 120 L28 114 C24 114 22 106 22 98 L26 86 Z"
          fill="#1B365D"
        />
        {/* Front Windshield (White with rounded slant) */}
        <path
          d="M120 66 L144 70 C149 71 152 76 150 82 L146 96 C145 98 142 100 138 100 L122 98 L120 66 Z"
          fill="#FFFFFF"
        />
        {/* Side Passenger Windows */}
        <path
          d="M32 90 L60 84 L60 96 L32 99 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M66 82 L94 76 L94 92 L66 95 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M100 75 L116 71 L116 90 L100 91 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        {/* Headlight Accent */}
        <path
          d="M142 106 L154 105 C156 105 157 108 155 110 L144 112 Z"
          fill="#FFFFFF"
        />
        {/* Bus Wheel Arc Details */}
        <circle cx="44" cy="114" r="7" fill="#0F2338" />
        <circle cx="44" cy="114" r="3.5" fill="#CBD5E1" />

        {/* Dynamic Sweeping Orange Forward Arrow */}
        <path
          d="M20 108 C20 134 46 144 76 136 C96 130 114 114 126 94 L114 88 L148 82 L146 122 L134 114 C120 132 100 148 72 154 C34 162 4 146 4 108 L20 108 Z"
          fill="url(#orangeArrowGrad)"
        />
      </g>

      <defs>
        <linearGradient id="orangeArrowGrad" x1="10" y1="130" x2="160" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="60%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#E87722" />
        </linearGradient>
      </defs>
    </svg>
  );

  const emblemSizes = {
    xs: 26,
    sm: 34,
    md: 44,
    lg: 58,
    xl: 84,
  };

  const currentEmblemSize = emblemSizes[size] || 44;

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <EmblemIcon iconSize={currentEmblemSize} />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center text-center ${className}`}>
        <div className="p-1 rounded-full bg-white shadow-xs">
          <EmblemIcon iconSize={currentEmblemSize * 1.3} />
        </div>
        <div className="mt-2 flex flex-col items-center">
          <div className="flex items-center text-2xl sm:text-3xl font-black tracking-tight leading-none">
            <span className={dark ? 'text-white' : 'text-[#1B365D]'}>Safr</span>
            <span className="text-[#E87722] ml-0.5">Saathi</span>
          </div>
          <div className={`text-[11px] font-black tracking-[0.2em] uppercase mt-1 ${dark ? 'text-[#bdc2ff]' : 'text-[#1B365D]'}`}>
            by PRTC
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex flex-col items-center bg-white p-3 rounded-full shadow-md border border-[#E2E8F0] ${className}`}>
        <EmblemIcon iconSize={currentEmblemSize * 1.5} />
        <div className="mt-1 flex flex-col items-center">
          <div className="flex items-center text-base sm:text-lg font-black tracking-tight leading-none">
            <span className="text-[#1B365D]">Safr</span>
            <span className="text-[#E87722] ml-0.5">Saathi</span>
          </div>
          <div className="text-[9px] font-black tracking-[0.2em] uppercase text-[#1B365D] mt-0.5">
            by PRTC
          </div>
        </div>
      </div>
    );
  }

  // Default: Horizontal navbar / header format
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      <div className="shrink-0 flex items-center justify-center p-0.5 bg-white rounded-2xl shadow-xs border border-[#eae8e7]">
        <EmblemIcon iconSize={currentEmblemSize} />
      </div>
      <div className="flex flex-col justify-center text-left leading-none">
        <div className="flex items-center text-lg sm:text-xl md:text-2xl font-black tracking-tight">
          <span className={dark ? 'text-white' : 'text-[#1B365D]'}>Safr</span>
          <span className="text-[#E87722] ml-0.5">Saathi</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] sm:text-[11px] font-black tracking-[0.15em] uppercase ${dark ? 'text-[#bdc2ff]' : 'text-[#1B365D]'}`}>
            by PRTC
          </span>
          <span className="text-[9px] font-bold bg-[#eae8e7] text-[#454652] px-1.5 py-0.2 rounded-md border border-[#c6c5d4] hidden sm:inline-block">
            Punjab Transit
          </span>
        </div>
      </div>
    </div>
  );
};
