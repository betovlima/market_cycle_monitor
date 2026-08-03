function IconShape({ name }) {
  switch (name) {
    case 'grid':
      return <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>
    case 'chart':
      return <><path d="M4 18V6"/><path d="M4 18h16"/><path d="m7 15 4-5 3 3 5-7"/></>
    case 'status':
      return <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></>
    case 'lock':
      return <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>
    case 'link':
      return <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></>
    case 'clock':
      return <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>
    case 'building':
      return <><path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/></>
    case 'pie':
      return <><path d="M12 3v9h9A9 9 0 1 1 12 3Z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15Z"/></>
    case 'up':
      return <><path d="m4 16 5-5 4 4 7-8"/><path d="M14 7h6v6"/></>
    case 'down':
      return <><path d="m4 8 5 5 4-4 7 8"/><path d="M14 17h6v-6"/></>
    case 'refresh':
      return <><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></>
    case 'logout':
      return <><path d="M10 5H5v14h5"/><path d="m14 8 4 4-4 4"/><path d="M18 12H9"/></>
    case 'eye':
      return <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>
    case 'menu':
      return <><path d="M4 7h16M4 12h16M4 17h16"/></>
    default:
      return <path d="M3 12h4l2-6 4 12 2-6h6"/>
  }
}

export function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <IconShape name={name} />
    </svg>
  )
}

export function MonitorMark({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#07111f" />
      <circle
        cx="32"
        cy="32"
        r="23"
        fill="none"
        stroke="#2f8cff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="118 26"
        transform="rotate(-34 32 32)"
      />
      <path
        d="M17 40l9-9 7 5 14-15"
        fill="none"
        stroke="#36d39a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 21h6v6"
        fill="none"
        stroke="#36d39a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
