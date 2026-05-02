# CodeGuard AI - React Frontend

Modern React-based UI with Framer Motion animations and shadcn/ui components for CodeGuard AI.

## Features

- 🎨 **Modern UI**: Built with React 18 and Vite for fast development
- ✨ **Smooth Animations**: Framer Motion for fluid transitions and interactions
- 🎯 **shadcn/ui Components**: Beautiful, accessible components with Tailwind CSS
- 🌙 **Dark Theme**: Elegant dark mode design with purple accents
- 📊 **Real-time Analysis**: Live diff analysis with visual feedback
- 🔒 **Security Focus**: Clear risk indicators and security warnings
- 📱 **Responsive**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Production-ready animation library
- **Lucide React** - Beautiful icon library
- **shadcn/ui** - High-quality component library

## Getting Started

### Prerequisites

- Node.js 14+ and npm 6+
- Backend server running on port 3000

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
cd frontend
npm install
```

### Development

Run the development server with hot reload:

```bash
# From frontend directory
npm run dev

# Or from root directory
npm run frontend:dev
```

The dev server will start at `http://localhost:5173` with API proxy to `http://localhost:3000`.

### Building for Production

Build the optimized production bundle:

```bash
# From frontend directory
npm run build

# Or from root directory
npm run frontend:build
```

The build output will be in `frontend/dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
# From frontend directory
npm run preview

# Or from root directory
npm run frontend:preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── card.jsx
│   │   │   ├── button.jsx
│   │   │   ├── textarea.jsx
│   │   │   └── badge.jsx
│   │   └── Dashboard.jsx    # Main dashboard component
│   ├── lib/
│   │   └── utils.js         # Utility functions
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles & Tailwind
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── package.json             # Dependencies
```

## Component Overview

### Dashboard Component

The main component that provides:

- **Diff Input**: Large textarea for pasting git diffs
- **Example Loader**: Quick load sample diff for testing
- **Analysis Button**: Trigger AI analysis with loading state
- **Results Display**: 
  - Pipeline decision with reasoning
  - Risk metrics cards
  - Security issues list
  - Full analysis report
- **Animations**: Smooth transitions for all interactions
- **Copy to Clipboard**: Easy copying of reports and issues

### UI Components

All UI components follow shadcn/ui patterns:

- **Card**: Container with header, content, and footer
- **Button**: Multiple variants (default, outline, ghost, etc.)
- **Textarea**: Styled text input with focus states
- **Badge**: Status indicators with color variants

## API Integration

The frontend communicates with the backend API:

- **Endpoint**: `POST /api/analyze`
- **Request**: `{ diff: string }`
- **Response**: Analysis results with risk assessment

In development, Vite proxies API requests to `http://localhost:3000`.

In production, the React app is served from the backend at `/react` route.

## Customization

### Colors

Edit `frontend/src/index.css` to customize the color scheme:

```css
:root {
  --primary: 263.4 70% 50.4%;  /* Purple */
  --background: 222.2 84% 4.9%; /* Dark background */
  /* ... more colors */
}
```

### Animations

Modify Framer Motion animations in `Dashboard.jsx`:

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
>
  {/* Content */}
</motion.div>
```

## Deployment

The React app is served by the Express backend:

1. Build the frontend: `npm run frontend:build`
2. Start the backend: `npm run web`
3. Access React UI at: `http://localhost:3000/react`
4. Vanilla JS UI remains at: `http://localhost:3000/`

Both UIs work simultaneously and use the same backend API.

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Connection Issues

Ensure the backend is running on port 3000:

```bash
npm run web
```

### Port Conflicts

If port 5173 is in use, Vite will automatically use the next available port.

## Contributing

When adding new features:

1. Follow the existing component structure
2. Use Tailwind CSS for styling
3. Add Framer Motion animations for interactions
4. Ensure responsive design
5. Test with the backend API

## License

MIT License - Same as CodeGuard AI main project