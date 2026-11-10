import { cn } from '../../lib/cn'

const palette = ['#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#60a5fa', '#facc15', '#f87171', '#2dd4bf', '#c084fc']

// eslint-disable-next-line react-refresh/only-export-components
export function colorFor(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
}

export function Avatar({ name = '?', color, size = 'md', className, children }) {
  const c = color || colorFor(name)
  return (
    <div
      className={cn('grid shrink-0 place-items-center rounded-full font-display font-bold uppercase', sizes[size], className)}
      style={{
        background: `color-mix(in oklab, ${c} 18%, transparent)`,
        color: c,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${c} 40%, transparent)`,
      }}
    >
      {children ?? name.charAt(0)}
    </div>
  )
}
