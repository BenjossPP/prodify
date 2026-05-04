'use client'

import { useState } from 'react'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ComposableMap, Geographies, Geography, ZoomableGroup } = require('react-simple-maps')

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Correspondance ISO alpha-2 → ISO numeric (subset des plus courants)
const ALPHA2_TO_NUMERIC: Record<string, string> = {
  AF: '004', AL: '008', DZ: '012', AD: '020', AO: '024', AR: '032', AM: '051',
  AU: '036', AT: '040', AZ: '031', BS: '044', BH: '048', BD: '050', BE: '056',
  BZ: '084', BJ: '204', BT: '064', BO: '068', BA: '070', BW: '072', BR: '076',
  BN: '096', BG: '100', BF: '854', BI: '108', CV: '132', KH: '116', CM: '120',
  CA: '124', CF: '140', TD: '148', CL: '152', CN: '156', CO: '170', KM: '174',
  CG: '178', CD: '180', CR: '188', CI: '384', HR: '191', CU: '192', CY: '196',
  CZ: '203', DK: '208', DJ: '262', DO: '214', EC: '218', EG: '818', SV: '222',
  GQ: '226', ER: '232', EE: '233', ET: '231', FJ: '242', FI: '246', FR: '250',
  GA: '266', GM: '270', GE: '268', DE: '276', GH: '288', GR: '300', GT: '320',
  GN: '324', GW: '624', GY: '328', HT: '332', HN: '340', HU: '348', IS: '352',
  IN: '356', ID: '360', IR: '364', IQ: '368', IE: '372', IL: '376', IT: '380',
  JM: '388', JP: '392', JO: '400', KZ: '398', KE: '404', KP: '408', KR: '410',
  KW: '414', KG: '417', LA: '418', LV: '428', LB: '422', LS: '426', LR: '430',
  LY: '434', LI: '438', LT: '440', LU: '442', MG: '450', MW: '454', MY: '458',
  MV: '462', ML: '466', MT: '470', MR: '478', MU: '480', MX: '484', MD: '498',
  MC: '492', MN: '496', ME: '499', MA: '504', MZ: '508', MM: '104', NA: '516',
  NP: '524', NL: '528', NZ: '554', NI: '558', NE: '562', NG: '566', MK: '807',
  NO: '578', OM: '512', PK: '586', PA: '591', PG: '598', PY: '600', PE: '604',
  PH: '608', PL: '616', PT: '620', QA: '634', RO: '642', RU: '643', RW: '646',
  SA: '682', SN: '686', RS: '688', SL: '694', SG: '702', SK: '703', SI: '705',
  SO: '706', ZA: '710', ES: '724', LK: '144', SD: '729', SR: '740', SZ: '748',
  SE: '752', CH: '756', SY: '760', TW: '158', TJ: '762', TZ: '834', TH: '764',
  TL: '626', TG: '768', TT: '780', TN: '788', TR: '792', TM: '795', UG: '800',
  UA: '804', AE: '784', GB: '826', US: '840', UY: '858', UZ: '860', VE: '862',
  VN: '704', YE: '887', ZM: '894', ZW: '716',
}

interface CountryData {
  code: string
  name: string
  sessions: number
}

interface WorldMapProps {
  countries: CountryData[]
  maxSessions: number
}

function getColor(sessions: number, max: number): string {
  if (sessions === 0 || max === 0) return 'rgba(255,255,255,0.05)'
  const ratio = Math.min(sessions / max, 1)
  // Interpoler entre violet sombre et violet vif
  const r = Math.round(88 + ratio * (168 - 88))
  const g = Math.round(28 + ratio * (85 - 28))
  const b = Math.round(135 + ratio * (247 - 135))
  const alpha = 0.25 + ratio * 0.75
  return `rgba(${r},${g},${b},${alpha})`
}

export default function WorldMap({ countries, maxSessions }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  // Map numeric ISO → data
  const dataByNumeric: Record<string, CountryData> = {}
  countries.forEach(c => {
    const numeric = ALPHA2_TO_NUMERIC[c.code.toUpperCase()]
    if (numeric) dataByNumeric[numeric] = c
  })

  return (
    <div className="relative w-full" style={{ userSelect: 'none' }}>
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 140 }}
        style={{ width: '100%', height: '340px' }}
      >
        <ZoomableGroup zoom={1} center={[0, 20]}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: Array<{ rsmKey: string; id: string | number }> }) =>
              geographies.map((geo: { rsmKey: string; id: string | number }) => {
                const numericId = String(geo.id)
                const countryData = dataByNumeric[numericId]
                const sessions = countryData?.sessions ?? 0
                const color = getColor(sessions, maxSessions)

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={color}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none', cursor: sessions > 0 ? 'pointer' : 'default' },
                      hover: { outline: 'none', fill: sessions > 0 ? 'rgba(192,132,252,0.85)' : 'rgba(255,255,255,0.08)' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={(e: React.MouseEvent) => {
                      if (countryData) {
                        setTooltip({
                          x: e.clientX,
                          y: e.clientY,
                          content: `${countryData.name} — ${countryData.sessions} session${countryData.sessions > 1 ? 's' : ''}`,
                        })
                      }
                    }}
                    onMouseMove={(e: React.MouseEvent) => {
                      if (countryData) {
                        setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-1.5 rounded-lg bg-[#13131f] border border-white/10 text-xs text-white/80 shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-3 mt-4 justify-end">
        <span className="text-xs text-white/30">Peu de visites</span>
        <div className="flex gap-0.5">
          {[0.1, 0.25, 0.45, 0.65, 0.85, 1].map((r, i) => (
            <div key={i} className="w-5 h-2.5 rounded-sm" style={{ background: getColor(r * maxSessions, maxSessions) }} />
          ))}
        </div>
        <span className="text-xs text-white/30">Beaucoup</span>
      </div>
    </div>
  )
}
