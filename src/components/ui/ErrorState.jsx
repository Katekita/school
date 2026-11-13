export default function ErrorState({ title, description, action, className = '' }) {
  return (
    <div className={`ui-error-state ${className}`.trim()} role="alert">
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
