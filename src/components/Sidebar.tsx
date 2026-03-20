import { FC, useState } from 'react'
import '../styles/layout.css'

export interface A6FormData {
  latitude: string
  longitude: string
  height: string
  azimuth: string
}

export interface C6FormData {
  latitude: string
  longitude: string
  height: string
}

export interface BuildingFormData {
  height: string
  coordinates: Array<[number, number]>
}

export interface SiteSubmitData {
  a6: A6FormData
  c6: C6FormData
  building: BuildingFormData
}

interface SidebarProps {
  onSubmit?: (data: SiteSubmitData) => void
}

const Sidebar: FC<SidebarProps> = ({ onSubmit }) => {
  const preventWheelValueChange = (e: React.WheelEvent<HTMLInputElement>) => {
    // Number inputs change on mouse wheel when focused/hovered; this is easy to trigger while scrolling.
    // Blur prevents the wheel from incrementing/decrementing the value.
    e.currentTarget.blur()
  }

  const [a6, setA6] = useState<A6FormData>({
    latitude: '',
    longitude: '',
    height: '',
    azimuth: '',
  })

  const [c6, setC6] = useState<C6FormData>({
    latitude: '',
    longitude: '',
    height: '',
  })

  const [building, setBuilding] = useState({
    height: '',
    coordinatesText: '',
  })

  // Parse coordinates from textarea text
  const parseCoordinates = (text: string): Array<[number, number]> => {
    const coordinates: Array<[number, number]> = []
    
    // Split by newline and process each line
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    
    for (const line of lines) {
      // Split by comma and parse each value
      const parts = line.split(',').map(p => p.trim())
      
      // Process comma-separated values in pairs
      // This handles both "lat,lon" (one per line) and "lat,lon,lat,lon,..." (multiple on one line)
      for (let i = 0; i < parts.length - 1; i += 2) {
        const lat = parseFloat(parts[i])
        const lon = parseFloat(parts[i + 1])
        
        // Validate that both values are numbers
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push([lat, lon])
        }
      }
    }
    
    return coordinates
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Parse coordinates from textarea
    const coordinates = parseCoordinates(building.coordinatesText)

    const submitData: SiteSubmitData = {
      a6,
      c6,
      building: {
        height: building.height,
        coordinates,
      },
    }

    if (onSubmit) {
      onSubmit(submitData)
    }

    console.log('Submitted data:', submitData)
  }

  return (
    <aside className="sidebar">
      <form onSubmit={handleSubmit} className="sidebar-form">
        {/* A6 Section */}
        <div className="sidebar-section">
          <h2>A6 Zone</h2>
          <div className="form-group">
            <label htmlFor="a6-latitude">Latitude</label>
            <input
              id="a6-latitude"
              type="number"
              step="0.00001"
              value={a6.latitude}
              onChange={(e) => setA6({ ...a6, latitude: e.target.value })}
              onWheel={preventWheelValueChange}
              placeholder="e.g., 28.6139"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="a6-longitude">Longitude</label>
            <input
              id="a6-longitude"
              type="number"
              step="0.00001"
              value={a6.longitude}
              onChange={(e) => setA6({ ...a6, longitude: e.target.value })}
              onWheel={preventWheelValueChange}
              placeholder="e.g., 77.2090"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="a6-height">Height (m)</label>
            <input
              id="a6-height"
              type="number"
              step="0.1"
              value={a6.height}
              onChange={(e) => setA6({ ...a6, height: e.target.value })}
              onWheel={preventWheelValueChange}
              placeholder="e.g., 100"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="a6-azimuth">Azimuth (°)</label>
            <input
              id="a6-azimuth"
              type="number"
              step="0.1"
              min="0"
              max="360"
              value={a6.azimuth}
              onChange={(e) => setA6({ ...a6, azimuth: e.target.value })}
              onWheel={preventWheelValueChange}
              placeholder="e.g., 45"
              className="form-input"
            />
          </div>
        </div>

        {/* C6 Section */}
        <div className="sidebar-section">
          <h2>C6 Spectrum</h2>
          <div className="form-group">
            <label htmlFor="c6-latitude">Latitude</label>
            <input
              id="c6-latitude"
              type="number"
              step="0.00001"
              value={c6.latitude}
              onChange={(e) => setC6({ ...c6, latitude: e.target.value })}
              onWheel={preventWheelValueChange}
              placeholder="e.g., 28.6139"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="c6-longitude">Longitude</label>
            <input
              id="c6-longitude"
              type="number"
              step="0.00001"
              value={c6.longitude}
              onChange={(e) => setC6({ ...c6, longitude: e.target.value })}
              onWheel={preventWheelValueChange}
              placeholder="e.g., 77.2090"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="c6-height">Height (m)</label>
            <input
              id="c6-height"
              type="number"
              step="0.1"
              value={c6.height}
              onChange={(e) => setC6({ ...c6, height: e.target.value })}
              onWheel={preventWheelValueChange}
              placeholder="e.g., 150"
              className="form-input"
            />
          </div>
        </div>

        {/* Building Section */}
        <div className="sidebar-section">
          <h2>Building</h2>
          <div className="form-group">
            <label htmlFor="building-height">Height (m)</label>
            <input
              id="building-height"
              type="number"
              step="0.1"
              value={building.height}
              onChange={(e) => setBuilding({ ...building, height: e.target.value })}
              onWheel={preventWheelValueChange}
              placeholder="e.g., 50"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="building-coordinates">Building Coordinates</label>
            <textarea
              id="building-coordinates"
              value={building.coordinatesText}
              onChange={(e) => setBuilding({ ...building, coordinatesText: e.target.value })}
              //placeholder={"12.9716,77.5946\n12.9718,77.5949\n12.9721,77.5945"}
              className="form-textarea"
              rows={5}
            />
            <small className="form-hint">
              Enter coordinates as lat,lon pairs, one per line. One point: marker. Two or more: polygon.
            </small>
          </div>
        </div>

        <button type="submit" className="submit-button">
          Submit Site Data
        </button>
      </form>
    </aside>
  )
}

export default Sidebar
