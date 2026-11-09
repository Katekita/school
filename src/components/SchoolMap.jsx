import { useEffect, useState } from 'react'
import { CircleHelp, ExternalLink, MapPin, Navigation, Search } from 'lucide-react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Reveal from './Reveal'
import { useLanguage } from '../i18n/LanguageContext'

const bishkekCenter = [42.8746, 74.5698]
const markerIcon = L.divIcon({
  className: 'school-map-marker',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function MapNavigator({ position }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 0.8 })
  }, [map, position])
  return null
}

export default function SchoolMap() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState(bishkekCenter)
  // Сообщение держим только как результат поиска: базовый текст берётся из
  // перевода при каждом рендере, иначе он «застывает» на старом языке.
  const [result, setResult] = useState(null)
  const [searching, setSearching] = useState(false)

  async function searchAddress(event) {
    event.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const params = new URLSearchParams({
        q: `${query}, Bishkek, Kyrgyzstan`,
        format: 'jsonv2',
        limit: '1',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
      if (!response.ok) throw new Error('search failed')
      const results = await response.json()
      if (!results.length) {
        setResult({ kind: 'notFound' })
      } else {
        setPosition([Number(results[0].lat), Number(results[0].lon)])
        setResult({ kind: 'found', name: results[0].display_name })
      }
    } catch {
      setResult({ kind: 'error' })
    } finally {
      setSearching(false)
    }
  }

  const message = searching
    ? t('map.searching')
    : result?.kind === 'found'
      ? `${t('map.found')}: ${result.name}`
      : result?.kind === 'notFound'
        ? t('map.notFound')
        : result?.kind === 'error'
          ? t('map.error')
          : t('map.defaultMsg')

  const twoGisUrl = `https://2gis.kg/bishkek/search/${encodeURIComponent('№68 мектеп А. Осмонов')}`

  return (
    <div className="map-layout">
      <Reveal>
        <div className="map-frame">
          <form className="map-search" onSubmit={searchAddress}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('map.searchPlaceholder')}
              aria-label={t('map.searchAria')}
            />
            <button type="submit" disabled={searching} aria-label={t('map.searchBtn')}>
              <Search size={16} /> {t('map.searchBtn')}
            </button>
          </form>
          <MapContainer
            className="leaflet-map"
            center={bishkekCenter}
            zoom={12}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapNavigator position={position} />
            <Marker position={position} icon={markerIcon} />
          </MapContainer>
          <p className="map-notice" role="status">
            {message}
          </p>
        </div>
      </Reveal>
      <Reveal className="map-side" delay={100}>
        <h2>{t('map.title')}</h2>
        <p>{t('map.subtitle')}</p>
        <div className="map-detail">
          <MapPin size={18} />
          <div>
            <strong>{t('map.addressLabel')}</strong>
            <span>{t('map.addressValue')}</span>
          </div>
        </div>
        <div className="map-detail">
          <Navigation size={18} />
          <div>
            <strong>{t('map.cityLabel')}</strong>
            <span>{t('map.cityValue')}</span>
          </div>
        </div>
        <div className="map-detail">
          <CircleHelp size={18} />
          <div>
            <strong>{t('map.infoLabel')}</strong>
            <span>{t('map.infoValue')}</span>
          </div>
        </div>
        <a className="button-primary" href={twoGisUrl} target="_blank" rel="noreferrer">
          {t('map.open2gis')} <ExternalLink size={16} />
        </a>
      </Reveal>
    </div>
  )
}
