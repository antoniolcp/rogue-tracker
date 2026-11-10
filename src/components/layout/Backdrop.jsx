/** Fixed ambient background: grid + slow aurora blobs tinted by the current app accent. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div
        className="absolute -top-40 -left-32 size-[38rem] rounded-full opacity-[0.13] blur-[120px] animate-[aurora_18s_ease-in-out_infinite]"
        style={{ background: 'var(--accent)' }}
      />
      <div
        className="absolute top-1/3 -right-40 size-[34rem] rounded-full opacity-[0.10] blur-[120px] animate-[aurora_22s_ease-in-out_infinite_reverse]"
        style={{ background: 'var(--accent-2)' }}
      />
    </div>
  )
}
