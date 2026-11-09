import { useEffect, useRef } from 'react'

// Передаёт координаты курсора в CSS-переменные карточки: по ним рисует
// «прожектор» (см. .spotlight в portal.css). Слушатель навешан на контейнер
// списка, а не на каждую карточку — меньше обработчиков на больших сетках.
export default function useSpotlight(hoverable = true) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (!hoverable || window.matchMedia('(hover: none)').matches) return

    const onMove = (event) => {
      const card = event.target.closest('.spotlight')
      if (!card || !node.contains(card)) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
      card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
    }

    node.addEventListener('pointermove', onMove)
    return () => node.removeEventListener('pointermove', onMove)
  }, [hoverable])

  return ref
}
