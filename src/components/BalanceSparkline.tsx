interface BalanceSparklineProps {
  values: number[]
}

export function BalanceSparkline({ values }: BalanceSparklineProps) {
  if (values.length < 2) return null

  const width = 300
  const height = 56
  const padding = 4
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return [x, y] as const
  })

  const linePath = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`

  return (
    <div className="mt-3 h-14 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="finza-balance-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#finza-balance-fill)" className="finza-sparkline-area" />
        <path
          d={linePath}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="finza-sparkline-line"
        />
      </svg>
      <style>{`
        .finza-sparkline-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: finza-draw-line 1.1s ease-out forwards;
        }
        .finza-sparkline-area {
          opacity: 0;
          animation: finza-fade-in 1.1s ease-out 0.2s forwards;
        }
        @keyframes finza-draw-line {
          to { stroke-dashoffset: 0; }
        }
        @keyframes finza-fade-in {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
