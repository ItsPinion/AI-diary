/** Hand-drawn-style open diary with a quill, tinted by the active theme. */

export function DiaryIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 170"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="inkwell-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--card))" />
          <stop offset="100%" stopColor="hsl(var(--background-secondary))" />
        </linearGradient>
        <linearGradient id="inkwell-ink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" />
        </linearGradient>
        <linearGradient id="inkwell-cover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent) / 0.28)" />
          <stop offset="100%" stopColor="hsl(var(--accent) / 0.12)" />
        </linearGradient>
      </defs>

      {/* soft glow blobs */}
      <circle cx="36" cy="42" r="44" fill="hsl(var(--accent) / 0.1)" />
      <circle cx="166" cy="126" r="52" fill="hsl(var(--secondary) / 0.16)" />
      <circle cx="104" cy="14" r="10" fill="hsl(var(--accent) / 0.16)" />
      <circle cx="12" cy="104" r="7" fill="hsl(var(--secondary) / 0.5)" />

      {/* sparkles */}
      <path
        d="M150 22 l2.2 5.4 5.4 2.2 -5.4 2.2 -2.2 5.4 -2.2 -5.4 -5.4 -2.2 5.4 -2.2 Z"
        fill="hsl(var(--accent) / 0.7)"
      />
      <path
        d="M36 78 l1.5 3.8 3.8 1.5 -3.8 1.5 -1.5 3.8 -1.5 -3.8 -3.8 -1.5 3.8 -1.5 Z"
        fill="hsl(var(--secondary))"
      />

      {/* book cover */}
      <rect
        x="32"
        y="56"
        width="136"
        height="98"
        rx="14"
        fill="url(#inkwell-cover)"
        stroke="hsl(var(--accent) / 0.25)"
      />

      {/* left page */}
      <path
        d="M 46 68 L 100 60 L 100 146 L 46 154 Z"
        fill="url(#inkwell-page)"
        stroke="hsl(var(--border-strong) / 0.8)"
        strokeLinejoin="round"
      />
      {/* right page */}
      <path
        d="M 100 60 L 154 68 L 154 154 L 100 146 Z"
        fill="url(#inkwell-page)"
        stroke="hsl(var(--border-strong) / 0.8)"
        strokeLinejoin="round"
      />
      {/* spine */}
      <path d="M 100 60 L 100 146" stroke="hsl(var(--accent) / 0.45)" strokeWidth="1.4" />

      {/* ruled lines */}
      <g stroke="hsl(var(--faint))" strokeWidth="1.1" strokeLinecap="round">
        <path d="M 56 84 L 88 79" />
        <path d="M 56 96 L 88 91" />
        <path d="M 56 108 L 88 103" />
        <path d="M 56 120 L 74 117" />
        <path d="M 112 79 L 144 84" />
        <path d="M 112 91 L 144 96" />
        <path d="M 112 103 L 144 108" />
        <path d="M 126 117 L 144 120" />
      </g>

      {/* quill */}
      <g>
        <path
          d="M 34 132 C 74 98, 112 78, 168 30 C 158 58, 152 88, 128 118 C 106 138, 74 146, 40 138 Z"
          fill="url(#inkwell-ink)"
          opacity="0.92"
        />
        <path d="M 36 130 L 166 32" stroke="hsl(var(--card))" strokeWidth="1.6" strokeLinecap="round" />
        <g stroke="hsl(var(--card) / 0.85)" strokeWidth="1.1" strokeLinecap="round">
          <path d="M 62 110 L 82 96" />
          <path d="M 88 92 L 106 78" />
          <path d="M 114 74 L 132 58" />
          <path d="M 140 52 L 152 42" />
        </g>
      </g>
    </svg>
  );
}
