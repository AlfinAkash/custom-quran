export const Card = ({ title, children, className = '' }) => (
  <section className={`rounded-3xl border border-gold/25 bg-linear-to-br from-emerald/60 to-emerald/20 p-4 shadow-lg shadow-black/10 sm:p-6 ${className}`}>
    {title && <h2 className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.16em] text-gold"><span className="h-px w-6 bg-gold/60" />{title}</h2>}{children}
  </section>
)
