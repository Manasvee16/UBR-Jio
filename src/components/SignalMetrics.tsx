import { FC, useState } from 'react'

interface SignalMetricsProps {
  defaultThreshold?: number
}

interface MetricsResult {
  rssi: number
  sinr: number
}

// Placeholder function to calculate signal metrics
// In real implementation, this would call an API or perform actual calculations
function calculateSignalMetrics(threshold: number): MetricsResult {
  // Simulate calculation based on threshold
  // RSSI typically ranges from -30 (excellent) to -120 (poor)
  const rssi = threshold - Math.random() * 20
  
  // SINR typically ranges from -5 to 40 dB
  const sinr = Math.random() * 30 + (threshold / 100) * 5
  
  return {
    rssi: Math.round(rssi),
    sinr: Math.round(sinr * 10) / 10
  }
}

const SignalMetrics: FC<SignalMetricsProps> = ({ defaultThreshold = -75 }) => {
  const [threshold, setThreshold] = useState<string>(defaultThreshold.toString())
  const [metrics, setMetrics] = useState<MetricsResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const preventWheelValueChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur()
  }

  const handleCalculate = () => {
    setIsCalculating(true)
    const thresholdValue = parseFloat(threshold)
    
    if (isNaN(thresholdValue)) {
      alert('Please enter a valid number')
      setIsCalculating(false)
      return
    }

    // Simulate async calculation
    setTimeout(() => {
      const result = calculateSignalMetrics(thresholdValue)
      setMetrics(result)
      setIsCalculating(false)
    }, 300)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate()
    }
  }

  return (
    <div className="signal-metrics-container">
      <h3>Signal Metrics</h3>

      {/* Input Section */}
      <div className="metrics-input-section">
        <div className="input-group">
          <label htmlFor="rssi-threshold">RSSI Threshold (dBm)</label>
          <input
            id="rssi-threshold"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            onKeyPress={handleKeyPress}
            onWheel={preventWheelValueChange}
            placeholder="-75"
            min="-120"
            max="-30"
            className="threshold-input"
          />
        </div>
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="calculate-button"
        >
          {isCalculating ? 'Calculating...' : 'Calculate'}
        </button>
      </div>

      {/* Output Section */}
      {metrics && (
        <div className="metrics-output-box">
          <div>RSSI: {metrics.rssi} dBm</div>
          <div>SINR: {metrics.sinr} dB</div>
        </div>
      )}
    </div>
  )
}

export default SignalMetrics
