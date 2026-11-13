import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PortalApp from './PortalApp.jsx'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`, {
    scope: import.meta.env.BASE_URL,
  }).catch((error) => {
    console.error('Service worker registration failed:', error)
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PortalApp />
  </StrictMode>,
)
