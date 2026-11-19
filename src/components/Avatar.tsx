import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8'
      : size === 'lg'
        ? 'h-14 w-14'
        : 'h-10 w-10';

  const iconSizeClass =
    size === 'sm'
      ? 'h-4 w-4'
      : size === 'lg'
        ? 'h-6 w-6'
        : 'h-5 w-5';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${name} profile picture`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${sizeClass} shrink-0 rounded-xl object-cover border-2 border-[#29232D] bg-[#FCE2DE]`}
      />
    );
  }

  return (
    <div
      aria-label={`${name} blank profile picture`}
      className={`${sizeClass} shrink-0 flex items-center justify-center rounded-xl bg-[#FCE2DE] border-2 border-[#29232D] text-[#29232D]`}
    >
      <User className={iconSizeClass} aria-hidden="true" />
    </div>
  );
}
