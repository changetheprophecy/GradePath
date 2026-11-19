import React from 'react';

export function HeroAcademicIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 540 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Illustration of a student sitting on a stack of books surrounded by floating GPA charts, report cards, graduation cap, and academic stationery"
    >
      {/* Subtle decorative backdrop shapes */}
      <circle cx="280" cy="220" r="175" fill="#F8D0CC" stroke="#29232D" strokeWidth="2.5" strokeDasharray="8 8" />
      <circle cx="430" cy="110" r="32" fill="#F6D36B" stroke="#29232D" strokeWidth="2.5" />
      <circle cx="96" cy="296" r="22" fill="#A7D9AE" stroke="#29232D" strokeWidth="2.5" />

      {/* Sparkle accents */}
      <path
        d="M112 94L116 106L128 110L116 114L112 126L108 114L96 110L108 106L112 94Z"
        fill="#F6D36B"
        stroke="#29232D"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M448 292L451 300L459 303L451 306L448 314L445 306L437 303L445 300L448 292Z"
        fill="#FFFFFF"
        stroke="#29232D"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Stack of Books (Base) */}
      {/* Bottom Book - Deep Purple */}
      <rect x="130" y="346" width="276" height="40" rx="10" fill="#7955A1" stroke="#29232D" strokeWidth="3" />
      <rect x="148" y="354" width="224" height="24" rx="5" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.2" />
      <line x1="170" y1="366" x2="290" y2="366" stroke="#A88BC5" strokeWidth="3" strokeLinecap="round" />

      {/* Middle Book - Sky Blue */}
      <rect x="150" y="304" width="244" height="42" rx="10" fill="#75B9DF" stroke="#29232D" strokeWidth="3" />
      <line x1="175" y1="325" x2="285" y2="325" stroke="#29232D" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="318" y="314" width="54" height="22" rx="5" fill="#FCE2DE" stroke="#29232D" strokeWidth="2.2" />

      {/* Top Book - Warm Yellow */}
      <rect x="168" y="264" width="208" height="40" rx="10" fill="#F6D36B" stroke="#29232D" strokeWidth="3" />
      <rect x="184" y="272" width="160" height="24" rx="5" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.2" />
      <path d="M352 264V316L364 307L376 316V264" fill="#F29A9C" stroke="#29232D" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Student Sitting on Books */}
      {/* Legs */}
      <path
        d="M258 232L218 266L200 262"
        stroke="#29232D"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M258 232L218 266L200 262"
        stroke="#7955A1"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M288 232L322 266L340 262"
        stroke="#29232D"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M288 232L322 266L340 262"
        stroke="#7955A1"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sneakers */}
      <rect x="182" y="252" width="28" height="16" rx="8" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.8" />
      <rect x="330" y="252" width="28" height="16" rx="8" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.8" />

      {/* Torso / Sweater */}
      <path
        d="M234 176C234 158 248 148 272 148C296 148 310 158 310 176L316 238C316 244 310 248 302 248H242C234 248 228 244 228 238L234 176Z"
        fill="#F29A9C"
        stroke="#29232D"
        strokeWidth="3"
      />
      {/* Collar */}
      <path d="M256 150L272 164L288 150" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Head & Hair */}
      <circle cx="272" cy="116" r="28" fill="#FCE2DE" stroke="#29232D" strokeWidth="3" />
      <path
        d="M242 114C242 94 256 80 274 80C292 80 304 94 304 114C304 102 290 96 274 96C258 96 248 102 242 114Z"
        fill="#29232D"
      />
      <circle cx="262" cy="117" r="2.5" fill="#29232D" />
      <circle cx="282" cy="117" r="2.5" fill="#29232D" />
      <path d="M265 127C269 131 275 131 279 127" stroke="#29232D" strokeWidth="2.5" strokeLinecap="round" />

      {/* Graduation Cap on Head */}
      <path d="M272 64L312 78L272 92L232 78L272 64Z" fill="#7955A1" stroke="#29232D" strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M252 84V95C252 98 261 101 272 101C283 101 292 98 292 95V84" fill="#A88BC5" stroke="#29232D" strokeWidth="2.6" />
      <path d="M306 80V98" stroke="#F6D36B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="306" cy="100" r="4" fill="#F6D36B" stroke="#29232D" strokeWidth="2" />

      {/* Laptop / Notebook in Hands */}
      <path
        d="M228 190L248 214M314 190L294 214"
        stroke="#29232D"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="240" y="196" width="64" height="42" rx="8" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.8" />
      <circle cx="272" cy="217" r="6" fill="#A7D9AE" stroke="#29232D" strokeWidth="2" />

      {/* Floating GPA Chart Card (Top Right) */}
      <g transform="translate(342, 74)">
        <rect x="0" y="0" width="152" height="106" rx="16" fill="#FFFFFF" stroke="#29232D" strokeWidth="3" />
        <text x="16" y="25" fill="#29232D" fontSize="12" fontWeight="700" fontFamily="Poppins, sans-serif">
          GPA Progress
        </text>
        <path
          d="M18 78L46 62L74 68L104 42L134 28"
          stroke="#7955A1"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M124 27H135V38" stroke="#7955A1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="78" r="4.5" fill="#F6D36B" stroke="#29232D" strokeWidth="2" />
        <circle cx="46" cy="62" r="4.5" fill="#F29A9C" stroke="#29232D" strokeWidth="2" />
        <circle cx="74" cy="68" r="4.5" fill="#75B9DF" stroke="#29232D" strokeWidth="2" />
        <circle cx="104" cy="42" r="4.5" fill="#A7D9AE" stroke="#29232D" strokeWidth="2" />
        <circle cx="134" cy="28" r="5" fill="#7955A1" stroke="#29232D" strokeWidth="2" />
      </g>

      {/* Floating Report Card (Top Left) */}
      <g transform="translate(46, 134) rotate(-6)">
        <rect x="0" y="0" width="138" height="94" rx="16" fill="#FFFFFF" stroke="#29232D" strokeWidth="3" />
        <rect x="14" y="14" width="44" height="24" rx="7" fill="#A7D9AE" stroke="#29232D" strokeWidth="2.2" />
        <text x="24" y="31" fill="#29232D" fontSize="13" fontWeight="800" fontFamily="Poppins, sans-serif">
          A+
        </text>
        <text x="68" y="31" fill="#7955A1" fontSize="15" fontWeight="800" fontFamily="Poppins, sans-serif">
          4.00
        </text>
        <line x1="16" y1="54" x2="120" y2="54" stroke="#29232D" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="68" x2="96" y2="68" stroke="#A88BC5" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Floating Academic Certificate (Bottom Right) */}
      <g transform="translate(384, 212) rotate(5)">
        <rect x="0" y="0" width="118" height="82" rx="14" fill="#FCE2DE" stroke="#29232D" strokeWidth="3" />
        <line x1="16" y1="24" x2="72" y2="24" stroke="#29232D" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="16" y1="40" x2="62" y2="40" stroke="#7955A1" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="90" cy="48" r="14" fill="#F6D36B" stroke="#29232D" strokeWidth="2.5" />
        <path d="M84 60L80 76L90 70L100 76L96 60" fill="#F29A9C" stroke="#29232D" strokeWidth="2.2" strokeLinejoin="round" />
      </g>

      {/* Stationery: Pencil & Ruler (Bottom Left) */}
      <g transform="translate(56, 326) rotate(-18)">
        <rect x="0" y="0" width="76" height="16" rx="4" fill="#F6D36B" stroke="#29232D" strokeWidth="2.5" />
        <path d="M76 0L92 8L76 16Z" fill="#FCE2DE" stroke="#29232D" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M86 5L92 8L86 11Z" fill="#29232D" />
      </g>
    </svg>
  );
}

export function DashboardWelcomeIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="16" y="76" width="112" height="32" rx="8" fill="#7955A1" stroke="#29232D" strokeWidth="2.5" />
      <rect x="28" y="48" width="96" height="28" rx="8" fill="#F6D36B" stroke="#29232D" strokeWidth="2.5" />
      <rect x="106" y="18" width="96" height="68" rx="12" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.5" />
      <path
        d="M120 68L138 54L156 58L174 38L188 32"
        stroke="#7955A1"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="188" cy="32" r="4.5" fill="#A7D9AE" stroke="#29232D" strokeWidth="2" />
      <path d="M62 18L92 28L62 38L32 28L62 18Z" fill="#75B9DF" stroke="#29232D" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="172" cy="98" r="14" fill="#F29A9C" stroke="#29232D" strokeWidth="2.5" />
      <path d="M167 98L171 102L178 94" stroke="#29232D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FeatureDashboardIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" fill="none" className={className} aria-hidden="true">
      <rect x="10" y="12" width="100" height="66" rx="12" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.5" />
      <rect x="22" y="44" width="14" height="22" rx="4" fill="#F29A9C" stroke="#29232D" strokeWidth="2" />
      <rect x="42" y="34" width="14" height="32" rx="4" fill="#F6D36B" stroke="#29232D" strokeWidth="2" />
      <rect x="62" y="26" width="14" height="40" rx="4" fill="#75B9DF" stroke="#29232D" strokeWidth="2" />
      <rect x="82" y="20" width="14" height="46" rx="4" fill="#A7D9AE" stroke="#29232D" strokeWidth="2" />
    </svg>
  );
}

export function FeaturePredictorIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" fill="none" className={className} aria-hidden="true">
      <rect x="14" y="12" width="92" height="66" rx="12" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.5" />
      <line x1="26" y1="32" x2="94" y2="32" stroke="#29232D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="68" cy="32" r="7" fill="#7955A1" stroke="#29232D" strokeWidth="2.2" />
      <line x1="26" y1="54" x2="94" y2="54" stroke="#29232D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="48" cy="54" r="7" fill="#F6D36B" stroke="#29232D" strokeWidth="2.2" />
      <rect x="76" y="44" width="22" height="20" rx="6" fill="#A7D9AE" stroke="#29232D" strokeWidth="2" />
    </svg>
  );
}

export function FeatureImprovementIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" fill="none" className={className} aria-hidden="true">
      <rect x="12" y="14" width="96" height="62" rx="12" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.5" />
      <path d="M24 58L48 48L72 52L94 26" stroke="#7955A1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M84 26H94V36" stroke="#7955A1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="58" r="5" fill="#F29A9C" stroke="#29232D" strokeWidth="2" />
      <circle cx="94" cy="26" r="5" fill="#A7D9AE" stroke="#29232D" strokeWidth="2" />
    </svg>
  );
}

export function FeatureMarksIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" fill="none" className={className} aria-hidden="true">
      <rect x="16" y="10" width="88" height="70" rx="12" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.5" />
      <rect x="28" y="24" width="16" height="16" rx="4" fill="#A7D9AE" stroke="#29232D" strokeWidth="2" />
      <path d="M32 32L35 35L41 28" stroke="#29232D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="52" y1="32" x2="90" y2="32" stroke="#29232D" strokeWidth="3" strokeLinecap="round" />
      <rect x="28" y="50" width="16" height="16" rx="4" fill="#F6D36B" stroke="#29232D" strokeWidth="2" />
      <line x1="52" y1="58" x2="84" y2="58" stroke="#A88BC5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function StepIllustration({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) {
    return (
      <svg viewBox="0 0 110 86" fill="none" className="h-20 w-24" aria-hidden="true">
        <rect x="12" y="12" width="86" height="62" rx="14" fill="#FCE2DE" stroke="#29232D" strokeWidth="2.5" />
        <circle cx="38" cy="38" r="12" fill="#7955A1" stroke="#29232D" strokeWidth="2.2" />
        <path d="M24 62C24 54 30 50 38 50C46 50 52 54 52 62" fill="#F6D36B" stroke="#29232D" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="58" y1="34" x2="86" y2="34" stroke="#29232D" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="58" y1="48" x2="80" y2="48" stroke="#7955A1" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (step === 2) {
    return (
      <svg viewBox="0 0 110 86" fill="none" className="h-20 w-24" aria-hidden="true">
        <rect x="12" y="12" width="86" height="62" rx="14" fill="#FFF4D6" stroke="#29232D" strokeWidth="2.5" />
        <rect x="24" y="26" width="62" height="14" rx="5" fill="#FFFFFF" stroke="#29232D" strokeWidth="2.2" />
        <rect x="24" y="46" width="62" height="14" rx="5" fill="#A7D9AE" stroke="#29232D" strokeWidth="2.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 110 86" fill="none" className="h-20 w-24" aria-hidden="true">
      <rect x="12" y="12" width="86" height="62" rx="14" fill="#E9DDF5" stroke="#29232D" strokeWidth="2.5" />
      <path d="M26 56L46 42L64 48L84 26" stroke="#29232D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="84" cy="26" r="6" fill="#F6D36B" stroke="#29232D" strokeWidth="2.2" />
    </svg>
  );
}
