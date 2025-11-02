# Kiwix Racer - Client

Vue.js frontend for the Kiwix Racer Wikipedia racing game.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vue Router** - Official router for Vue.js
- **Pinia** - State management
- **Vite** - Build tool and dev server
- **Bulma** - CSS framework
- **D3.js** - Data visualization library
- **Axios** - HTTP client

## Project Structure

```
client/
├── public/           # Static assets
├── src/
│   ├── assets/      # Images, styles, etc.
│   ├── components/  # Reusable Vue components
│   ├── views/       # Page components
│   ├── router/      # Vue Router configuration
│   ├── stores/      # Pinia stores
│   ├── App.vue      # Root component
│   └── main.js      # Application entry point
├── index.html       # HTML template
├── vite.config.js   # Vite configuration
└── package.json     # Dependencies and scripts
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Lint and fix files

## API Integration

The client communicates with the backend API at `http://localhost:3000/api`. The proxy is configured in `vite.config.js`.
