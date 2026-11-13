export default function EmptyState({ icon, eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`empty-state ui-empty-state ${className}`.trim()} role="status">
      {icon && <span className="ui-empty-state-icon" aria-hidden="true">{icon}</span>}
      <div className="ui-empty-state-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h3>{title}</h3>}
        {description && <p>{description}</p>}
        {children}
      </div>
    </section>
  )
}
