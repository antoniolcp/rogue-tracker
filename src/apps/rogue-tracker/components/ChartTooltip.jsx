/** Tooltip escuro reutilizável para gráficos Recharts. */
export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line-strong bg-surface-2/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label !== undefined && <div className="mb-1 font-medium text-fg">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color || p.stroke || p.fill }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-fg tabular">{formatter ? formatter(p.value, p) : p.value}</span>
        </div>
      ))}
    </div>
  )
}
