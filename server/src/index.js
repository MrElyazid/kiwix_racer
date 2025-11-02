import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import articlesRouter from "./routes/articles.js";
import gameRouter from "./routes/game.js";

// Import services
import zimService from "./services/zimService.js";
import { getArticleByPath } from "./controllers/articlesController.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/articles", articlesRouter);
app.use("/api/game", gameRouter);

// Special route for article content by path (like /api/article/A/Article_Name)
app.use("/api/article", getArticleByPath);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Kiwix Racer API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Initialize ZIM archive and start server
async function start() {
  try {
    const zimPath =
      process.env.ZIM_FILES_PATH || path.join(__dirname, "../../data/zim");
    const zimFiles = process.env.ZIM_FILE || "wiki_kiwix_08.zim";

    // Load default ZIM file
    const fullPath = path.join(zimPath, zimFiles);
    await zimService.loadZimFile(fullPath, "default");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;
