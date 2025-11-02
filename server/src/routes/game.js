import express from "express";
import {
  startGame,
  validatePath,
  getShortestPath,
} from "../controllers/gameController.js";

const router = express.Router();

// Start a new game session
router.post("/start", startGame);

// Validate a path between two articles
router.post("/validate", validatePath);

// Get shortest path between two articles (for hints or after game)
router.get("/path/:from/:to", getShortestPath);

export default router;
