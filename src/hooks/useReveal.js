import { useEffect, useRef, useState } from 'react'

// Хук плавного появления элемента при прокрутке (IntersectionObserver).
// Возвращает ref и флаг visible — элемент анимируется один раз при входе во вьюпорт.
export default function useReveal({ threshold = 0.15, rootMargin = '0px 0px -8% 0px' } = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(() => {
    // Если IntersectionObserver недоступен — сразу показываем
    if (typeof IntersectionObserver === 'undefined') return true
    return false
  })

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return { ref, visible }
}
