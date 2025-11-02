# Kiwix Racer - Server

Node.js/Express backend for the Kiwix Racer Wikipedia racing game.

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **@openzim/libzim** - Library for reading ZIM files
- **better-sqlite3** - SQLite database driver
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger

## Project Structure

```
server/
├── src/
│   ├── controllers/     # Request handlers
│   │   ├── articlesController.js
│   │   └── gameController.js
│   ├── routes/          # API routes
│   │   ├── articles.js
│   │   └── game.js
│   ├── services/        # Business logic
│   │   ├── zimService.js
│   │   ├── databaseService.js
│   │   └── pathfindingService.js
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Helper functions
│   └── index.js         # Application entry point
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
└── package.json         # Dependencies and scripts
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Run development server:

```bash
npm run dev
```

The server will be available at `http://localhost:3000`

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

## API Endpoints

### Articles

- `GET /api/articles/random` - Get a random article
- `GET /api/articles/search?q=query` - Search articles
- `GET /api/articles/:title/metadata` - Get article metadata
- `GET /api/articles/:title/content` - Get article content

### Game

- `POST /api/game/start` - Start a new game session
- `POST /api/game/validate` - Validate a path
- `GET /api/game/path/:from/:to` - Get shortest path

### Health Check

- `GET /api/health` - Server health check

## Services

### ZIM Service

Handles reading Wikipedia content from ZIM archive files using `@openzim/libzim`.

### Database Service

Manages connections to SQLite databases containing article metadata and link relationships.

### Pathfinding Service

Implements BFS (Breadth-First Search) algorithm to find shortest paths between articles.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `ZIM_FILES_PATH` - Path to ZIM archive files
- `SQLITE_DB_PATH` - Path to SQLite databases
