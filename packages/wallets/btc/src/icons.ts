function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    svg.replace(/\s+/g, " ").trim()
  )}`;
}

export const XVERSE_ICON = svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="#EE7A30"/>
    <path d="M9 23 16 9l7 14h-4l-3-7-3 7H9z" fill="#fff"/>
  </svg>
`);

export const UNISAT_ICON = svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="#0923FF"/>
    <circle cx="16" cy="16" r="8" fill="none" stroke="#fff" stroke-width="2"/>
  </svg>
`);

export const PHANTOM_ICON = svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <defs>
      <linearGradient id="phantomGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stop-color="#534BB5"/>
        <stop offset="1" stop-color="#551BF9"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="6" fill="url(#phantomGradient)"/>
    <path d="M24.5 16c0-2.98-2.12-5.45-4.94-5.92l-4.44 7.85c.34.35.55.82.55 1.34 0 1.06-.86 1.91-1.92 1.91s-1.92-.85-1.92-1.91c0-1.05.87-1.89 1.92-1.9v-2.6c-2.64.19-4.75 2.45-4.75 5.21 0 2.88 2.36 5.2 5.25 5.2 1.35 0 2.56-.53 3.46-1.39l5.62-5.95s1.17-.87 1.17-1.84Z" fill="#fff"/>
    <circle cx="15.67" cy="12.91" r="1.92" fill="#fff" fill-opacity=".7"/>
  </svg>
`);

export const LEATHER_ICON = svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="#12100F"/>
    <path d="M10 8h4v16h-4V8Zm8 0h4v10h-4V8Z" fill="#F5F1ED"/>
  </svg>
`);

export const OKX_ICON = svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="#000"/>
    <rect x="7" y="7" width="7" height="7" fill="#fff"/>
    <rect x="18" y="7" width="7" height="7" fill="#fff"/>
    <rect x="12.5" y="12.5" width="7" height="7" fill="#fff"/>
    <rect x="7" y="18" width="7" height="7" fill="#fff"/>
    <rect x="18" y="18" width="7" height="7" fill="#fff"/>
  </svg>
`);
