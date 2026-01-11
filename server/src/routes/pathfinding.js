import express from "express";
import {
  findPath,
  buildGraph,
  lookupPage,
  searchPages,
  getRandomArticle,
  getDatabaseStats,
  getNeighbors,
} from "../controllers/pathfindingController.js";

const router = express.Router();

// Find shortest path between two articles
router.post("/find-path", findPath);

// Build graph structure around an article
router.post("/build-graph", buildGraph);

// Get neighbors of a specific node
router.post("/get-neighbors", getNeighbors);

// Look up a page by title
router.get("/page", lookupPage);

// Search for pages
router.get("/search", searchPages);

// Get random article
router.get("/random", getRandomArticle);

// Get database statistics
router.get("/stats", getDatabaseStats);

export default router;
