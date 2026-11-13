export default function Skeleton({ lines = 3, label, className = '' }) {
  return (
    <div
      className={`ui-skeleton ${className}`.trim()}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <span key={index} className="ui-skeleton-line" />
      ))}
    </div>
  )
}
