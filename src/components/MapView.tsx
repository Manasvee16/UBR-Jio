import { FC, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON, useMap } from 'react-leaflet'
// @ts-ignore - leaflet types are optional
import L from 'leaflet'
import { A6Data, C6Data, BuildingData } from './UBRPage'
import '../styles/layout.css'

interface MapViewProps {
  a6Data: A6Data[]
  c6Data: C6Data[]
  buildingData: BuildingData[]
}

// Small bright blue point for A6 center
const A6CenterIcon = L.divIcon({
  html: `<div style="width: 6px; height: 6px; background-color: #053a0f; border-radius: 50%; box-shadow: 0 0 3px rgba(107, 143, 214, 0.8);"></div>`,
  iconSize: [6, 6],
  iconAnchor: [3, 3],
  popupAnchor: [0, -3],
  className: 'custom-icon'
})

// Red point for A6 with azimuth (to show cone vertex)
const A6AzimuthIcon = L.divIcon({
  html: `<div style="width: 8px; height: 8px; background-color: #FF0000; border-radius: 50%; box-shadow: 0 0 4px rgba(255, 0, 0, 0.9);"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  popupAnchor: [0, -4],
  className: 'custom-icon'
})

// Small bright yellow point for C6
const C6Icon = L.divIcon({
  html: `<div style="width: 8px; height: 8px; background-color: #1f035c; border-radius: 50%; box-shadow: 0 0 4px rgba(255, 215, 0, 0.9);"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  popupAnchor: [0, -4],
  className: 'custom-icon'
})

// Small bright orange point for Building
const BuildingIcon = L.divIcon({
  html: `<div style="width: 8px; height: 8px; background-color: #640909; border-radius: 50%; box-shadow: 0 0 4px rgba(255, 140, 0, 0.9);"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  popupAnchor: [0, -4],
  className: 'custom-icon'
})

// Generate GeoJSON for azimuth cone
// Azimuth convention: 0° = North, 90° = East, 180° = South, 270° = West (clockwise)
const generateAzimuthConeGeoJSON = (lat: number, lon: number, azimuth: number): any => {
  // Normalise azimuth to [0, 360)
  const normalisedAzimuth = ((azimuth % 360) + 360) % 360
  const destinationPoint = (
    lat: number,
    lon: number,
    distanceKm: number,
    bearingDegrees: number
  ) => {
    const R = 6371 // Earth radius in km
    const lat1 = (lat * Math.PI) / 180
    const lon1 = (lon * Math.PI) / 180
    const bearing = (bearingDegrees * Math.PI) / 180
    const distance = distanceKm / R

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance) + Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing))
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1), Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2))

    return [
      (lon2 * 180) / Math.PI,
      (lat2 * 180) / Math.PI
    ]
  }

  // Create cone with 60-degree aperture (30 degrees on each side)
  const coneHalfAngle = 30
  const coneDistance = 2.5 // 2.5 km radius for cone

  // Left edge of cone
  const leftBearing = normalisedAzimuth - coneHalfAngle
  const leftPoint = destinationPoint(lat, lon, coneDistance, leftBearing)

  // Right edge of cone
  const rightBearing = normalisedAzimuth + coneHalfAngle
  const rightPoint = destinationPoint(lat, lon, coneDistance, rightBearing)

  // Add intermediate points along the arc for better visualization
  const arcPoints = []
  const steps = 8 // Number of intermediate points
  for (let i = 0; i <= steps; i++) {
    const bearing = leftBearing + (rightBearing - leftBearing) * (i / steps)
    arcPoints.push(destinationPoint(lat, lon, coneDistance, bearing))
  }

  // Create polygon: [vertex, arc points from left to right, back to vertex]
  const coneCoordinates = [
    [lon, lat],         // Vertex at A6 location
    ...arcPoints,       // Arc from left to right
    [lon, lat]          // Close polygon
  ]

  return {
    cone: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coneCoordinates]
      }
    },
    centerLine: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[lon, lat], destinationPoint(lat, lon, coneDistance, normalisedAzimuth)]
      }
    }
  }
}

// Generate GeoJSON for building polygon or return null if single point
const generateBuildingGeoJSON = (building: BuildingData): any => {
  if (!building.coordinates || building.coordinates.length < 2) {
    return null // Will render as marker instead
  }
  
  // Convert from [lat, lon] to [lon, lat] for GeoJSON
  const geoJsonCoordinates = building.coordinates.map(([lat, lon]) => [lon, lat])
  
  // Close the polygon by adding first coordinate at the end
  geoJsonCoordinates.push(geoJsonCoordinates[0])
  
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [geoJsonCoordinates]
    }
  }
}

// Component to handle auto-zoom
const MapAutoZoom: FC<{ a6Data: A6Data[]; c6Data: C6Data[]; buildingData: BuildingData[] }> = ({ a6Data, c6Data, buildingData }) => {
  const map = useMap()
  
  useEffect(() => {
    const bounds = L.latLngBounds([])
    
    // Add A6 bounds
    a6Data.forEach(a6 => {
      bounds.extend([a6.latitude, a6.longitude])
    })
    
    // Add C6 bounds
    c6Data.forEach(c6 => {
      bounds.extend([c6.latitude, c6.longitude])
    })
    
    // Add Building bounds
    buildingData.forEach(building => {
      bounds.extend([building.latitude, building.longitude])
    })
    
    // Fit map to bounds if bounds are valid
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 })
    }
  }, [a6Data, c6Data, buildingData, map])
  
  return null
}

const MapView: FC<MapViewProps> = ({ a6Data, c6Data, buildingData }) => {
  const defaultCenter = [20.5937, 78.9629] as [number, number]
  const defaultZoom = 5

  // Memoize A6 azimuth cone GeoJSON objects
  const a6AzimuthGeoJSON = useMemo(() => {
    return a6Data
      .filter(a6 => a6.azimuth !== undefined && !Number.isNaN(Number(a6.azimuth)))
      .map(a6 => ({
        id: a6.id,
        geojson: generateAzimuthConeGeoJSON(
          a6.latitude,
          a6.longitude,
          typeof a6.azimuth === 'string' ? parseFloat(a6.azimuth) : a6.azimuth as number
        ),
        a6
      }))
  }, [a6Data])

  // Memoize building GeoJSON objects
  const buildingGeoJSON = useMemo(() => {
    return buildingData
      .map(building => ({
        id: building.id,
        geojson: generateBuildingGeoJSON(building),
        building
      }))
      .filter(item => item.geojson !== null)
  }, [buildingData])

  // Determine which buildings should render as markers (single coordinate)
  const buildingMarkers = useMemo(() => {
    return buildingData.filter(b => !b.coordinates || b.coordinates.length < 2)
  }, [buildingData])

  const mapContainerProps = {
    center: defaultCenter as any,
    zoom: defaultZoom,
    style: { height: '100%', width: '100%' }
  } as any

  const tileLayerProps = {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  } as any

  return (
    <div className="map-view">
      <MapContainer {...mapContainerProps}>
        <TileLayer {...tileLayerProps} />
        
        {/* A6 Data - Azimuth Cones using GeoJSON */}
        {a6AzimuthGeoJSON.map(({ id, geojson, a6 }) => {
          // @ts-ignore - react-leaflet GeoJSON props
          const GeoJSONComponent = GeoJSON as any
          return (
            <GeoJSONComponent
              // Include azimuth in key so layer remounts when azimuth changes
              key={`a6-cone-${id}-${a6.azimuth}`}
              data={geojson.cone}
              style={() => ({
                color: '#2563EB',
                weight: 2,
                opacity: 0.6,
                fill: true,
                fillColor: '#2563EB',
                fillOpacity: 0.2
              })}
            />
          )
        })}
        
        {/* A6 Center point markers - show for all A6, different color for azimuth cones */}
        {a6Data.map(a6 => (
          /* @ts-ignore - react-leaflet API compatibility */
          <Marker 
            key={`a6-marker-${a6.id}`} 
            position={[a6.latitude, a6.longitude] as any} 
            icon={(a6.azimuth !== undefined ? A6AzimuthIcon : A6CenterIcon) as any}
          >
            {/* @ts-ignore - react-leaflet API compatibility */}
            <Tooltip permanent={false}>
              <span className="marker-label">A6</span>
            </Tooltip>
            <Popup>
              <div className="marker-popup">
                <strong>{a6.name}</strong><br />
                <em>A6 Zone</em><br />
                Lat: {a6.latitude.toFixed(5)}<br />
                Lon: {a6.longitude.toFixed(5)}<br />
                {a6.height && <>Height: {a6.height} m<br /></>}
                {a6.azimuth && <>Azimuth: {a6.azimuth}°<br /></>}
                Status: <span className="status-badge">{a6.status}</span><br />
                Coverage: <span className="coverage-badge">{a6.coverage}%</span>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* C6 Data Markers Only */}
        {c6Data.map(c6 => (
          /* @ts-ignore - react-leaflet API compatibility */
          <Marker key={c6.id} position={[c6.latitude, c6.longitude] as any} icon={C6Icon as any}>
            {/* @ts-ignore - react-leaflet API compatibility */}
            <Tooltip permanent={false}>
              <span className="marker-label">C6</span>
            </Tooltip>
            <Popup>
              <div className="marker-popup">
                <strong>{c6.type} Network</strong><br />
                <em>C6 Spectrum</em><br />
                Lat: {c6.latitude.toFixed(5)}<br />
                Lon: {c6.longitude.toFixed(5)}<br />
                {c6.height && <>Height: {c6.height} m<br /></>}
                Frequency: {c6.frequency}<br />
                Bandwidth: {c6.bandwidth} MHz
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Building Data - Polygons using GeoJSON */}
        {buildingGeoJSON.map(({ id, geojson }) => {
          // @ts-ignore - react-leaflet GeoJSON props
          const GeoJSONComponent = GeoJSON as any
          return (
            <GeoJSONComponent
              key={`building-polygon-${id}`}
              data={geojson}
              style={() => ({
                color: '#FF8C00',
                weight: 2,
                opacity: 1,
                fill: false
              })}
            />
          )
        })}
        
        {/* Building Data - Markers for single coordinate buildings */}
        {buildingMarkers.map(building => (
          /* @ts-ignore - react-leaflet API compatibility */
          <Marker key={`building-marker-${building.id}`} position={[building.latitude, building.longitude] as any} icon={BuildingIcon as any}>
            {/* @ts-ignore - react-leaflet API compatibility */}
            <Tooltip permanent={false}>
              <span className="marker-label">Building</span>
            </Tooltip>
            <Popup>
              <div className="marker-popup">
                <strong>{building.name}</strong><br />
                <em>{building.type.charAt(0).toUpperCase() + building.type.slice(1)}</em><br />
                {building.address}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Auto-zoom component */}
        <MapAutoZoom a6Data={a6Data} c6Data={c6Data} buildingData={buildingData} />
      </MapContainer>
    </div>
  )
}

export default MapView
