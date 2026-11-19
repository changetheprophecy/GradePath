import React from 'react';

interface LogoProps {
  compact?: boolean;
  variant?: 'light' | 'dark';
}

export function Logo({ compact = false, variant = 'light' }: LogoProps) {
  const isDarkSurface = variant === 'dark';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#29232D] ${
          isDarkSurface
            ? 'bg-[#F6D36B] text-[#29232D]'
            : 'bg-[#7955A1] text-white'
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 17L9.5 11.5L13.5 15L20 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 7H20V11.5"
            stroke={isDarkSurface ? '#7955A1' : '#F6D36B'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {!compact && (
        <span
          className={`font-display text-xl font-extrabold tracking-tight whitespace-nowrap ${
            isDarkSurface ? 'text-white' : 'text-[#29232D]'
          }`}
        >
          GradePath
        </span>
      )}
    </div>
  );
}
