import useReveal from '../hooks/useReveal'

// Оборачивает children и плавно проявляет их при попадании в зону видимости.
// delay — задержка в мс для каскадных анимаций списков.
export default function Reveal({ children, as: Tag = 'div', className = '', delay = 0, ...rest }) {
  const { ref, visible } = useReveal()
  return (
    <Tag
      ref={ref}
      className={`reveal${visible ? ' is-visible' : ''} ${className}`.trim()}
      style={delay ? { '--reveal-delay': `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
