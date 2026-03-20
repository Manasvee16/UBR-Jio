import { FC, useMemo } from 'react'
import { A6Data, C6Data, BuildingData } from './UBRPage'

interface FresnelCurveProps {
  a6Data?: A6Data
  c6Data?: C6Data
  buildingData?: BuildingData
}

const FresnelCurve: FC<FresnelCurveProps> = ({ a6Data, c6Data, buildingData }) => {
  const SVG_WIDTH = 600
  const SVG_HEIGHT = 220
  const PADDING = 45
  const DIAGRAM_WIDTH = SVG_WIDTH - PADDING * 2
  const DIAGRAM_HEIGHT = SVG_HEIGHT - PADDING * 2

  const { los, points, lowerCurvePath, description } = useMemo(() => {
    // Default values if no data provided
    if (!a6Data || !c6Data || !buildingData) {
      return {
        los: null,
        points: { a6: null, building: null, c6: null },
        lowerCurvePath: '',
        //description: 'Add A6, C6, and Building data to visualize line of sight'
      }
    }

    // ===== STEP 1: Get Heights =====
    const a6Height = typeof a6Data.height === 'string' ? parseFloat(a6Data.height) : (a6Data.height || 0)
    const c6Height = typeof c6Data.height === 'string' ? parseFloat(c6Data.height) : (c6Data.height || 0)
    const buildingHeight = typeof buildingData.height === 'string' ? parseFloat(buildingData.height) : (buildingData.height || 10)

    // ===== STEP 2: Calculate Horizontal Distances =====
    const a6ToBuildingDist = calculateDistance(
      a6Data.latitude,
      a6Data.longitude,
      buildingData.latitude,
      buildingData.longitude
    )
    const buildingToC6Dist = calculateDistance(
      buildingData.latitude,
      buildingData.longitude,
      c6Data.latitude,
      c6Data.longitude
    )
    const a6ToC6DirectDist = calculateDistance(
      a6Data.latitude,
      a6Data.longitude,
      c6Data.latitude,
      c6Data.longitude
    )
    
    // Check if building is on the direct path between A6 and C6
    const sumDist = a6ToBuildingDist + buildingToC6Dist
    const tolerance = 0.05 // 50 meters tolerance
    const buildingOnPath = Math.abs(sumDist - a6ToC6DirectDist) < tolerance
    
    const totalDist = a6ToC6DirectDist
    const totalDistM = Math.max(totalDist * 1000, 1)
    const buildingDistM = Math.max(a6ToBuildingDist * 1000, 0)

    // ===== STEP 3: Fresnel equation setup =====
    // r = sqrt(λ * d1 * d2 / (d1 + d2)), where distances are in meters and λ in meters
    const frequencyHz = parseFrequencyHz(c6Data.frequency) ?? 3.5e9
    const lambdaM = SPEED_OF_LIGHT_MPS / frequencyHz

    const lineHeightAt = (xM: number) => {
      const t = totalDistM === 0 ? 0 : xM / totalDistM
      return a6Height + (c6Height - a6Height) * t
    }

    const fresnelRadiusAt = (xM: number) => {
      const d1 = Math.max(0, xM)
      const d2 = Math.max(0, totalDistM - xM)
      if (d1 === 0 || d2 === 0) return 0
      return Math.sqrt((lambdaM * d1 * d2) / (d1 + d2))
    }

    const lowerBoundaryAt = (xM: number) => lineHeightAt(xM) - fresnelRadiusAt(xM)
    const upperBoundaryAt = (xM: number) => lineHeightAt(xM) + fresnelRadiusAt(xM)

    const upperAtBuilding = upperBoundaryAt(buildingDistM)
    const clearanceDistance = upperAtBuilding - buildingHeight

    // ===== STEP 4: Determine LOS/NLOS =====
    // Only check for building obstruction if it's actually on the direct path
    const buildingBlocksSignal = buildingOnPath && buildingHeight > upperAtBuilding
    const los = buildingBlocksSignal ? 'NLOS' : 'LOS'

    // ===== STEP 3: Calculate Max Values for Normalization =====
    const upperPeak = upperBoundaryAt(totalDistM / 2)
    const maxHeight = Math.max(a6Height, c6Height, buildingHeight, upperPeak, 50) // Min 50m for visualization
    const maxDistance = Math.max(totalDist, 1) // Prevent division by zero

    // ===== STEP 4: Apply Proportional Scaling =====
    // Formula: scaledValue = (actualValue / maxValue) * svgDimension
    // X-axis scaling (distances)
    const a6X_scaled = (0 / maxDistance) * DIAGRAM_WIDTH
    const buildingX_scaled = (a6ToBuildingDist / maxDistance) * DIAGRAM_WIDTH
    const c6X_scaled = (totalDist / maxDistance) * DIAGRAM_WIDTH

    // Y-axis scaling (heights) - inverted for SVG (higher = lower y)
    const a6Y_scaled = (a6Height / maxHeight) * DIAGRAM_HEIGHT
    const buildingY_scaled = (buildingHeight / maxHeight) * DIAGRAM_HEIGHT
    const c6Y_scaled = (c6Height / maxHeight) * DIAGRAM_HEIGHT

    // Add padding to get final positions
    const a6X = PADDING + a6X_scaled
    const buildingX = PADDING + buildingX_scaled
    const c6X = PADDING + c6X_scaled

    // Baseline is at bottom, heights are measured upward
    const baselineY = PADDING + DIAGRAM_HEIGHT
    const a6Y = baselineY - a6Y_scaled
    const buildingY = baselineY - buildingY_scaled
    const c6Y = baselineY - c6Y_scaled

    // ===== STEP 5: Build lower Fresnel curve path =====
    const samples = 64
    let lowerCurvePath = ''
    for (let i = 0; i <= samples; i++) {
      const xM = (totalDistM * i) / samples
      const distKm = xM / 1000
      const x = PADDING + (distKm / maxDistance) * DIAGRAM_WIDTH
      const h = lowerBoundaryAt(xM)
      const yScaled = (h / maxHeight) * DIAGRAM_HEIGHT
      const y = baselineY - yScaled
      lowerCurvePath += `${i === 0 ? 'M' : 'L'} ${x} ${y} `
    }

    const points = {
      a6: { x: a6X, y: a6Y, height: a6Height, distance: 0 },
      building: buildingOnPath ? { x: buildingX, y: buildingY, height: buildingHeight, distance: a6ToBuildingDist } : null,
      c6: { x: c6X, y: c6Y, height: c6Height, distance: totalDist }
    }

    const clearanceText = buildingBlocksSignal
      ? `Blocked by ${Math.abs(clearanceDistance).toFixed(1)}m`
      : buildingOnPath
      ? `Clearance: ${clearanceDistance.toFixed(1)}m`
      : 'No obstruction on path'

    const description = buildingOnPath
      ? `Distance: ${totalDist.toFixed(2)} km | A6: ${a6Height.toFixed(1)}m | Building: ${buildingHeight.toFixed(1)}m | C6: ${c6Height.toFixed(1)}m | ${clearanceText}`
      : `Distance: ${totalDist.toFixed(2)} km | A6: ${a6Height.toFixed(1)}m | C6: ${c6Height.toFixed(1)}m | ${clearanceText}`

    return { los, points, lowerCurvePath, description }
  }, [a6Data, c6Data, buildingData])

  return (
    <div className="fresnel-curve-container">
      <h3>Fresnel LOS Analysis</h3>

      {los ? (
        <div className="los-result">
          <div className={`los-status ${los.toLowerCase()}`}>
            {los}
          </div>
          <div className="los-description">{description}</div>
        </div>
      ) : (
        <div className="los-empty">{description}</div>
      )}

      <div className="fresnel-graph-container">
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="fresnel-diagram"
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block'
          }}
        >
        {/* Background */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#fafafa" stroke="#ddd" strokeWidth={1} />

        {/* Ground line */}
        <line
          x1={PADDING}
          y1={PADDING + DIAGRAM_HEIGHT}
          x2={PADDING + DIAGRAM_WIDTH}
          y2={PADDING + DIAGRAM_HEIGHT}
          stroke="#999"
          strokeWidth={2}
          strokeDasharray="4"
        />

        {/* Axes */}
        <line
          x1={PADDING - 5}
          y1={PADDING}
          x2={PADDING - 5}
          y2={PADDING + DIAGRAM_HEIGHT}
          stroke="#666"
          strokeWidth={1}
        />
        <line
          x1={PADDING}
          y1={PADDING + DIAGRAM_HEIGHT + 5}
          x2={PADDING + DIAGRAM_WIDTH}
          y2={PADDING + DIAGRAM_HEIGHT + 5}
          stroke="#666"
          strokeWidth={1}
        />

        {/* Fresnel zone (optional visual) - light blue shading */}
        {los && points.a6 && points.c6 && (
          <path
            d={`M ${points.a6.x} ${points.a6.y - 15} Q ${(points.a6.x + points.c6.x) / 2} ${(points.a6.y + points.c6.y) / 2 - 40} ${points.c6.x} ${points.c6.y - 15} L ${points.c6.x} ${PADDING + DIAGRAM_HEIGHT} L ${points.a6.x} ${PADDING + DIAGRAM_HEIGHT} Z`}
            fill="rgba(107, 143, 214, 0.1)"
            stroke="none"
          />
        )}

        {/* LOS Curve (Bezier) */}
        {los && points.a6 && points.c6 && (
          <path
            d={lowerCurvePath}
            stroke={los === 'LOS' ? '#4CAF50' : '#F44336'}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Vertical lines and labels */}
        {/* A6 vertical line */}
        {points.a6 && (
          <line
            x1={points.a6.x}
            y1={points.a6.y}
            x2={points.a6.x}
            y2={PADDING + DIAGRAM_HEIGHT}
            stroke="#6B8FD6"
            strokeWidth={1}
            strokeDasharray="2"
            opacity={0.6}
          />
        )}

        {/* Building vertical line */}
        {points.building && (
          <line
            x1={points.building.x}
            y1={points.building.y}
            x2={points.building.x}
            y2={PADDING + DIAGRAM_HEIGHT}
            stroke="#FF8C00"
            strokeWidth={1}
            strokeDasharray="2"
            opacity={0.6}
          />
        )}

        {/* C6 vertical line */}
        {points.c6 && (
          <line
            x1={points.c6.x}
            y1={points.c6.y}
            x2={points.c6.x}
            y2={PADDING + DIAGRAM_HEIGHT}
            stroke="#FFD700"
            strokeWidth={1}
            strokeDasharray="2"
            opacity={0.6}
          />
        )}

        {/* A6 Point */}
        {points.a6 && (
          <g>
            <circle
              cx={points.a6.x}
              cy={points.a6.y}
              r={5}
              fill="#2563EB"
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={points.a6.x}
              y={PADDING + DIAGRAM_HEIGHT + 20}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#2563EB"
            >
              A6
            </text>
            <text
              x={points.a6.x}
              y={points.a6.y - 12}
              textAnchor="middle"
              fontSize={9}
              fill="#666"
            >
              {points.a6.height.toFixed(0)}m
            </text>
          </g>
        )}

        {/* Building Point */}
        {points.building && (
          <g>
            <circle
              cx={points.building.x}
              cy={points.building.y}
              r={5}
              fill="#FF8C00"
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={points.building.x}
              y={PADDING + DIAGRAM_HEIGHT + 20}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#FF8C00"
            >
              Building
            </text>
            <text
              x={points.building.x}
              y={points.building.y - 12}
              textAnchor="middle"
              fontSize={9}
              fill="#666"
            >
              {points.building.height.toFixed(0)}m
            </text>
          </g>
        )}

        {/* C6 Point */}
        {points.c6 && (
          <g>
            <circle
              cx={points.c6.x}
              cy={points.c6.y}
              r={5}
              fill="#FFD700"
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={points.c6.x}
              y={PADDING + DIAGRAM_HEIGHT + 20}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#FFD700"
            >
              C6
            </text>
            <text
              x={points.c6.x}
              y={points.c6.y - 12}
              textAnchor="middle"
              fontSize={9}
              fill="#666"
            >
              {points.c6.height.toFixed(0)}m
            </text>
          </g>
        )}

        {/* Axis Labels */}
        <text
          x={PADDING - 35}
          y={PADDING - 8}
          fontSize={12}
          fontWeight="bold"
          fill="#333"
          textAnchor="end"
        >
          Height
        </text>
        <text
          x={PADDING + DIAGRAM_WIDTH / 2}
          y={SVG_HEIGHT - 5}
          fontSize={12}
          fontWeight="bold"
          fill="#333"
          textAnchor="middle"
        >
          Distance
        </text>
      </svg>
      </div>
    </div>
  )
}

const SPEED_OF_LIGHT_MPS = 299_792_458

function parseFrequencyHz(freq: string | undefined): number | null {
  if (!freq) return null
  const s = freq.trim().toLowerCase()
  const match = s.match(/([0-9]+(?:\.[0-9]+)?)\s*(ghz|mhz|khz|hz)\b/)
  if (!match) return null
  const value = parseFloat(match[1])
  if (Number.isNaN(value)) return null
  const unit = match[2]
  const scale =
    unit === 'ghz' ? 1e9 :
    unit === 'mhz' ? 1e6 :
    unit === 'khz' ? 1e3 :
    1
  return value * scale
}

// Calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default FresnelCurve
