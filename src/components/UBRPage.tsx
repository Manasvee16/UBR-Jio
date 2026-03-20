import { FC, useState } from 'react'
import Sidebar, { SiteSubmitData } from './Sidebar'
import MapView from './MapView'
import FresnelCurve from './FresnelCurve'
import SignalMetrics from './SignalMetrics'
import '../styles/layout.css'

export interface A6Data {
  id: string
  name: string
  latitude: number
  longitude: number
  status: string
  coverage: number
  height?: string | number
  azimuth?: number | string
}

export interface C6Data {
  id: string
  type: string
  frequency: string
  bandwidth: number
  latitude: number
  longitude: number
  height?: string | number
}

export interface BuildingData {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
  type: 'office' | 'datacenter' | 'retail'
  height?: string | number
  coordinates?: Array<[number, number]>
}

const UBRPage: FC = () => {
  const [a6Data, setA6Data] = useState<A6Data[]>([])

  const [c6Data, setC6Data] = useState<C6Data[]>([])

  const [buildingData, setBuildingData] = useState<BuildingData[]>([])

  const handleSiteSubmit = (data: SiteSubmitData) => {
    console.log('Site submission received in UBRPage:', data)
    
    // Update A6 data if latitude and longitude are provided
    if (data.a6.latitude !== '' && data.a6.longitude !== '') {
      const parsedLat = parseFloat(data.a6.latitude)
      const parsedLon = parseFloat(data.a6.longitude)

      if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
        console.warn('Invalid A6 coordinates, skipping A6 update', data.a6)
      } else {
        const parsedHeight = data.a6.height !== '' ? parseFloat(data.a6.height) : undefined
        const parsedAzimuth = data.a6.azimuth !== '' ? parseFloat(data.a6.azimuth) : undefined

      const newA6: A6Data = {
        id: 'a6-user',
        name: 'User A6 Zone',
        latitude: parsedLat,
        longitude: parsedLon,
        status: 'Active',
        coverage: 100,
        height: parsedHeight,
        azimuth: parsedAzimuth,
      }
      setA6Data([newA6])
      console.log('Added A6:', newA6)
    }
    }
    else {
      setA6Data([])
    }
    
    // Update C6 data if latitude and longitude are provided
    if (data.c6.latitude !== '' && data.c6.longitude !== '') {
      const parsedLat = parseFloat(data.c6.latitude)
      const parsedLon = parseFloat(data.c6.longitude)

      if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
        console.warn('Invalid C6 coordinates, skipping C6 update', data.c6)
      } else {
        const parsedHeight = data.c6.height !== '' ? parseFloat(data.c6.height) : undefined
      const newC6: C6Data = {
        id: 'c6-user',
        type: '5G',
        frequency: '3.5 GHz',
        bandwidth: 100,
        latitude: parsedLat,
        longitude: parsedLon,
        height: parsedHeight,
      }
      setC6Data([newC6])
      console.log('Added C6:', newC6)
    }
    }
    else {
      setC6Data([])
    }
    
    // Update building data with coordinates
    const buildingCoordinates = data.building.coordinates
    
    if (buildingCoordinates.length > 0) {
      const newBuilding: BuildingData = {
        id: 'bldg-user',
        name: 'User Building',
        latitude: buildingCoordinates[0][0],
        longitude: buildingCoordinates[0][1],
        address: 'User Defined Location',
        type: 'office',
        height: data.building.height ? parseFloat(data.building.height) : 10,
        coordinates: buildingCoordinates.length > 1 ? buildingCoordinates : undefined
      }
      setBuildingData([newBuilding])
      console.log('Added Building:', newBuilding)
    }
    else {
      setBuildingData([])
    }
  }

  return (
    <div className="ubr-page">
      <main className="app-main">
        <Sidebar onSubmit={handleSiteSubmit} />
        <div className="right-panel">
          <div className="map-section">
            <MapView 
              a6Data={a6Data}
              c6Data={c6Data}
              buildingData={buildingData}
            />
          </div>
          <div className="bottom-panels">
            <div className="fresnel-section">
              <FresnelCurve 
                a6Data={a6Data.at(-1)}
                c6Data={c6Data.at(-1)}
                buildingData={buildingData.at(-1)}
              />
            </div>
            <div className="metrics-section">
              <SignalMetrics rssi={-85} sinr={15} snr={18} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UBRPage
