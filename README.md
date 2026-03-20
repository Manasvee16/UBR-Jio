# UBR - Unified Broadband Resource Management

A React-based telecom network planning and management tool built with React Leaflet for geographic visualization and network resource management.

## Features

- **Interactive Map Visualization**: Real-time network topology visualization using React Leaflet and OpenStreetMap
- **Network Management Tools**: Tools for network overview, coverage analysis, resource planning, and performance metrics
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Filtering**: Filter networks by type (4G, 5G, Fiber Optic, Cell Towers)
- **Modern UI**: Dark/Light theme support with professional styling

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Installation

1. Navigate to the project directory:
```bash
cd UBR
```

2. Install dependencies:
```bash
npm install
```

## Development

To start the development server:

```bash
npm run dev
```

The application will open automatically at `http://localhost:3000`

## Build

To build the project for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
├── src/
│   ├── App.tsx              # Main application component
│   ├── App.css              # App component styles
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # TypeScript config for Vite
├── vite.config.ts           # Vite configuration
├── eslint.config.js         # ESLint configuration
└── .gitignore               # Git ignore rules
```

## Technologies Used

- **React 18**: UI library for building interactive interfaces
- **React Leaflet 4**: React components for Leaflet maps
- **Leaflet**: Open-source JavaScript library for interactive maps
- **TypeScript**: For type-safe development
- **Vite**: Modern, fast build tool and dev server
- **CSS3**: Advanced styling with flexbox and grid

## Map Features

The application includes:
- Interactive map centered on India
- Network markers at major hub locations (Delhi, Mumbai, Chennai)
- Popup information for each network node
- Zoom and pan capabilities
- OpenStreetMap tile layer

## Customization

### Adding Network Markers

Edit `src/App.tsx` to add more markers:

```typescript
<Marker position={[latitude, longitude]}>
  <Popup>
    Location Name<br />
    Status: Active
  </Popup>
</Marker>
```

### Changing Map Center

Modify the `defaultCenter` variable in `src/App.tsx`:

```typescript
const defaultCenter = [latitude, longitude] as [number, number]
```

### Styling

- Global styles are in `src/index.css`
- Component-specific styles are in `src/App.css`
- CSS variables for theme colors and spacing are defined in `:root`

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

Copyright © 2026 UBR Telecom. All rights reserved.

## Support

For issues or questions, please contact the development team.
