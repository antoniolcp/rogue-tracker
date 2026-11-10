import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Lightweight sortable table.
 * columns: [{ key, header, cell?: (row, i) => node, sortValue?: row => any, align?: 'left'|'right'|'center',
 *             className?, headerClassName?, sortable?: boolean, sticky?: boolean }]
 */
export function DataTable({
  columns,
  rows,
  rowKey = (r, i) => i,
  initialSort,
  onRowClick,
  rowClassName,
  rowStyle,
  className,
  dense = false,
  emptyMessage = 'Sem dados.',
}) {
  const [sort, setSort] = useState(initialSort || null) // { key, dir }

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return rows
    const get = col.sortValue || ((r) => r[col.key])
    const copy = [...rows]
    copy.sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      if (typeof va === 'string' || typeof vb === 'string') {
        return String(va ?? '').localeCompare(String(vb ?? ''), 'pt') * (sort.dir === 'asc' ? 1 : -1)
      }
      return ((va ?? 0) - (vb ?? 0)) * (sort.dir === 'asc' ? 1 : -1)
    })
    return copy
  }, [rows, sort, columns])

  const toggle = (key) => {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: 'desc' }
      if (s.dir === 'desc') return { key, dir: 'asc' }
      return null
    })
  }

  const alignClass = (a) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left')

  return (
    <div className={cn('scrollbar-thin overflow-x-auto rounded-2xl border border-line bg-surface/60', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => {
              const sortable = col.sortable !== false
              const active = sort?.key === col.key
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'bg-surface-2/60 px-3 py-2.5 text-[11px] font-semibold tracking-wider whitespace-nowrap text-muted uppercase',
                    alignClass(col.align),
                    col.sticky && 'sticky left-0 z-10 bg-surface-2',
                    col.headerClassName,
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggle(col.key)}
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-1 uppercase hover:text-fg',
                        active && 'text-accent',
                        col.align === 'right' && 'flex-row-reverse',
                      )}
                    >
                      {col.header}
                      {active ? (
                        sort.dir === 'desc' ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUp className="size-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          )}
          {sorted.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={rowStyle?.(row, i)}
              className={cn(
                'group border-b border-line last:border-0 transition-colors hover:bg-white/[0.025]',
                onRowClick && 'cursor-pointer',
                rowClassName?.(row, i),
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-3 whitespace-nowrap tabular',
                    dense ? 'py-2' : 'py-3',
                    alignClass(col.align),
                    col.sticky && 'sticky left-0 z-10 bg-surface group-hover:bg-surface-2',
                    col.className,
                  )}
                >
                  {col.cell ? col.cell(row, i) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
