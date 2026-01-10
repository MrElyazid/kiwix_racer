import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

// Import routes
import articlesRouter from "./routes/articles.js";
import pathfindingRouter from "./routes/pathfinding.js";

// Import controllers
import { getArticleByPath } from "./controllers/articlesController.js";

// Import Socket.IO handlers
import { setupGameSocket } from "./sockets/gameSocket.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/articles", articlesRouter);
app.use("/api/pathfinding", pathfindingRouter);

// Special route for article content by path (like /api/article/A/Article_Name)
app.use("/api/article", getArticleByPath);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Wikipedia Racer API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Setup Socket.IO
setupGameSocket(io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Using Wikipedia REST API for article content`);
  console.log(`Using SDOW database for pathfinding and visualization`);
  console.log(`Socket.IO enabled for multiplayer functionality`);
});

export default app;
