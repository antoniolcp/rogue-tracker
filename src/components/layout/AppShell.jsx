import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LayoutGrid } from 'lucide-react'
import { Backdrop } from './Backdrop'
import { cn } from '../../lib/cn'

/**
 * Shared chrome for each app: sticky glass navbar + animated route outlet.
 * nav: [{ to, label, icon, end? }]
 */
export function AppShell({ app, brand, nav, cta, footer }) {
  const location = useLocation()
  return (
    <div data-app={app} className="relative min-h-dvh">
      <Backdrop />

      <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
          <Link
            to="/"
            title="Los Chinelos Hub"
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-line text-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            <LayoutGrid className="size-4" />
          </Link>
          <Link to={`/${app}`} className="flex shrink-0 items-center gap-2.5">
            {brand}
          </Link>

          <nav className="no-scrollbar ml-4 hidden flex-1 items-center gap-1 overflow-x-auto xl:flex">
            {nav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 xl:ml-0">{cta}</div>
        </div>

        {/* Mobile / tablet nav */}
        <nav className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-2 md:px-6 xl:hidden">
          {nav.map((item) => (
            <NavItem key={item.to} {...item} compact />
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {footer && (
        <footer className="mx-auto max-w-7xl border-t border-line px-4 py-8 text-sm text-subtle md:px-6">{footer}</footer>
      )}
    </div>
  )
}

function NavItem({ to, label, icon: Icon, end, compact }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'relative flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-colors 2xl:px-3',
          isActive ? 'text-fg' : 'text-muted hover:text-fg',
          compact && 'h-8 px-2.5 text-[13px]',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={compact ? 'nav-active-m' : 'nav-active'}
              className="absolute inset-0 rounded-lg bg-white/[0.07] ring-1 ring-line-strong"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            />
          )}
          {Icon && <Icon className={cn('relative size-4', !compact && 'hidden 2xl:block', isActive && 'text-accent')} />}
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  )
}
