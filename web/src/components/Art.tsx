// Hand-authored SVG artwork — a "similar style" stand-in for the custom lemon
// illustrations and avatar (soft, rounded, sunset palette). Pure vector, no assets.

export function LemonLogo({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="lemonBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFEC9E" />
          <stop offset="1" stopColor="#F4C430" />
        </linearGradient>
      </defs>
      {/* leaf */}
      <path d="M23 8 C26 4 31 5 31 5 C31 9 28 12 24 12 C22 11 21.5 9.5 23 8 Z" fill="#7CB342" />
      <path d="M24 11 C26 9 29 7 30.5 6" stroke="#5a9230" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="19" cy="24" rx="13" ry="12" fill="url(#lemonBody)" />
      <circle cx="19" cy="12.4" r="1.5" fill="#E3AE2B" />
      {/* highlight */}
      <ellipse cx="13.5" cy="19" rx="3.6" ry="2.3" fill="#FFF6CC" opacity="0.75" />
      {/* sleepy face */}
      <path d="M12.5 23.5 q2.2 2.2 4.4 0" stroke="#7a5a20" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M21 23.5 q2.2 2.2 4.4 0" stroke="#7a5a20" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M15.5 28 q3.5 2.6 7 0" stroke="#7a5a20" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="27" r="1.6" fill="#F7A8C4" opacity="0.7" />
      <circle cx="26" cy="27" r="1.6" fill="#F7A8C4" opacity="0.7" />
    </svg>
  );
}

export function SidebarScene({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="room" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8E8D6" />
          <stop offset="0.55" stopColor="#F3E1E4" />
          <stop offset="1" stopColor="#EFE5F6" />
        </linearGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BBE2F2" />
          <stop offset="0.5" stopColor="#F6C9CB" />
          <stop offset="1" stopColor="#F9D7A8" />
        </linearGradient>
        <linearGradient id="lemonBig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFEC9E" />
          <stop offset="1" stopColor="#F4C430" />
        </linearGradient>
        <clipPath id="win">
          <path d="M82 150 L82 78 A38 38 0 0 1 158 78 L158 150 Z" />
        </clipPath>
      </defs>

      {/* room */}
      <rect width="240" height="240" fill="url(#room)" />

      {/* window */}
      <g>
        <path d="M82 150 L82 78 A38 38 0 0 1 158 78 L158 150 Z" fill="url(#sky)" />
        <g clipPath="url(#win)">
          <circle cx="120" cy="92" r="13" fill="#FBE6AE" />
          <ellipse cx="98" cy="74" rx="13" ry="5" fill="#ffffff" opacity="0.7" />
          <ellipse cx="140" cy="86" rx="10" ry="4" fill="#ffffff" opacity="0.6" />
          <polygon points="78,150 108,112 138,150" fill="#B9A3DE" />
          <polygon points="116,150 150,120 162,150" fill="#9E83C9" />
        </g>
        {/* frame + mullions */}
        <path d="M82 150 L82 78 A38 38 0 0 1 158 78 L158 150" fill="none" stroke="#FBF3E6" strokeWidth="6" strokeLinejoin="round" />
        <line x1="120" y1="44" x2="120" y2="150" stroke="#FBF3E6" strokeWidth="4" />
        <line x1="82" y1="112" x2="158" y2="112" stroke="#FBF3E6" strokeWidth="4" />
      </g>

      {/* floor shadow */}
      <ellipse cx="120" cy="206" rx="96" ry="20" fill="#EBD9C4" opacity="0.6" />

      {/* plant, bottom-left */}
      <g>
        <path d="M40 196 L60 196 L57 214 L43 214 Z" fill="#C98B6B" />
        <path d="M40 196 L60 196 L59 200 L41 200 Z" fill="#B5775A" />
        <path d="M50 196 C44 180 40 172 36 166" stroke="#6FA23C" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="35" cy="166" rx="6" ry="10" fill="#86C24A" transform="rotate(-25 35 166)" />
        <ellipse cx="50" cy="160" rx="6" ry="11" fill="#6FA23C" />
        <ellipse cx="63" cy="168" rx="6" ry="10" fill="#86C24A" transform="rotate(28 63 168)" />
      </g>

      {/* mug */}
      <g>
        <path d="M64 184 q2 -1 4 -3" stroke="#E7C7B0" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        <rect x="60" y="186" width="18" height="16" rx="4" fill="#9E83C9" />
        <path d="M78 190 a5 5 0 0 1 0 9" fill="none" stroke="#9E83C9" strokeWidth="3" />
        <rect x="60" y="186" width="18" height="4" rx="2" fill="#8a6fb8" />
      </g>

      {/* cushion */}
      <ellipse cx="124" cy="194" rx="44" ry="14" fill="#C6A6E2" />
      <ellipse cx="124" cy="191" rx="44" ry="13" fill="#D4B8EC" />

      {/* big sleeping lemon on cushion */}
      <g>
        <path d="M138 150 C143 142 150 143 150 143 C150 150 145 155 139 155 C136 154 135.5 152 138 150 Z" fill="#7CB342" />
        <ellipse cx="124" cy="168" rx="27" ry="25" fill="url(#lemonBig)" />
        <circle cx="124" cy="144" r="2.6" fill="#E3AE2B" />
        <ellipse cx="113" cy="159" rx="6" ry="3.6" fill="#FFF6CC" opacity="0.75" />
        <path d="M112 167 q4 4 8 0" stroke="#7a5a20" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M128 167 q4 4 8 0" stroke="#7a5a20" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M117 176 q7 5 14 0" stroke="#7a5a20" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="110" cy="174" r="3" fill="#F7A8C4" opacity="0.7" />
        <circle cx="138" cy="174" r="3" fill="#F7A8C4" opacity="0.7" />
      </g>
    </svg>
  );
}

export function AvatarArt({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`${className} rounded-full`} aria-hidden>
      <defs>
        <linearGradient id="avBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9D8FB" />
          <stop offset="1" stopColor="#D8C2F2" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill="url(#avBg)" />
      {/* hair back */}
      <path d="M8 30 C8 14 32 14 32 30 L32 40 L8 40 Z" fill="#3A2E4D" />
      {/* face */}
      <circle cx="20" cy="20" r="9" fill="#F3C9A8" />
      {/* bangs */}
      <path d="M11 19 C11 9 29 9 29 19 C26 14 24 13 20 13 C16 13 14 14 11 19 Z" fill="#3A2E4D" />
      <path d="M11 19 C11 24 12 27 13 29 L13 19 Z" fill="#3A2E4D" />
      <path d="M29 19 C29 24 28 27 27 29 L27 19 Z" fill="#3A2E4D" />
      {/* eyes + smile */}
      <circle cx="16.5" cy="20.5" r="1.1" fill="#3A2E4D" />
      <circle cx="23.5" cy="20.5" r="1.1" fill="#3A2E4D" />
      <path d="M17.5 24.5 q2.5 2 5 0" stroke="#B5736A" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="14.5" cy="23" r="1.3" fill="#F7A8C4" opacity="0.6" />
      <circle cx="25.5" cy="23" r="1.3" fill="#F7A8C4" opacity="0.6" />
    </svg>
  );
}
