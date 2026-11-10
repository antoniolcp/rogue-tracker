import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({ eyebrow, title, description, icon: Icon, actions, backTo, backLabel = 'Voltar' }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        )}
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {Icon && <Icon className="size-3.5" />}
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  )
}

export function SectionTitle({ children, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-center justify-between gap-3 ${className}`}>
      <h2 className="font-display text-lg font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}
