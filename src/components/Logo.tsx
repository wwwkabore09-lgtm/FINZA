interface LogoProps {
  showText?: boolean
  className?: string
}

export function Logo({ showText = true, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="9" fill="#059669" />
        <path
          d="M9 22V14.5C9 11.4624 11.4624 9 14.5 9H17.5"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path d="M9 15.5H16" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M22.5 11L18.5 17L16 14.5L11.5 20.5"
          stroke="#6EE7B7"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 11H22.5V14.5"
          stroke="#6EE7B7"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="text-xl font-semibold tracking-tight text-slate-900">Finza</span>
      )}
    </span>
  )
}
