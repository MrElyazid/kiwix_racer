/**
 * Pathfinding Controller
 * Handles API requests for Wikipedia path finding and graph visualization
 */

import pathfindingService from "../services/pathfindingService.js";
import sdowService from "../services/sdowService.js";

/**
 * Find shortest path between two articles
 * POST /api/pathfinding/find-path
 * Body: { source: "Article_Title", target: "Target_Title", max_depth: 6 }
 */
export const findPath = async (req, res) => {
  try {
    const { source, target, max_depth = 6 } = req.body;

    if (!source || !target) {
      return res.status(400).json({
        error: "Both source and target article titles are required",
      });
    }

    console.log(`Finding path from "${source}" to "${target}"`);

    const result = await pathfindingService.findPath(source, target, max_depth);

    res.json(result);
  } catch (error) {
    console.error("Error finding path:", error);
    res.status(500).json({
      error: "Failed to find path",
      message: error.message,
    });
  }
};

/**
 * Build graph structure around an article
 * POST /api/pathfinding/build-graph
 * Body: { root: "Article_Title", max_depth: 2, max_nodes: 50 }
 */
export const buildGraph = async (req, res) => {
  try {
    const {
      root,
      max_depth = 2,
      max_nodes = 50,
      max_neighbors_per_node = 20,
    } = req.body;

    if (!root) {
      return res.status(400).json({
        error: "Root article title is required",
      });
    }

    console.log(`Building graph for "${root}"`);

    const graph = pathfindingService.buildGraph(
      root,
      max_depth,
      max_nodes,
      max_neighbors_per_node
    );

    res.json(graph);
  } catch (error) {
    console.error("Error building graph:", error);
    res.status(500).json({
      error: "Failed to build graph",
      message: error.message,
    });
  }
};

/**
 * Look up a page by title
 * GET /api/pathfinding/page?title=Article_Title
 */
export const lookupPage = async (req, res) => {
  try {
    const { title } = req.query;

    if (!title) {
      return res.status(400).json({
        error: "Article title is required",
      });
    }

    const page = sdowService.findPageByTitle(title);

    if (!page) {
      return res.status(404).json({
        error: `Article "${title}" not found`,
      });
    }

    // Resolve redirect if necessary
    if (page.is_redirect) {
      const resolved = sdowService.resolveRedirect(page.id);
      if (resolved) {
        return res.json({
          ...page,
          redirect_to: resolved.title,
          redirect_id: resolved.target_id,
        });
      }
    }

    res.json(page);
  } catch (error) {
    console.error("Error looking up page:", error);
    res.status(500).json({
      error: "Failed to lookup page",
      message: error.message,
    });
  }
};

/**
 * Search for pages by title prefix
 * GET /api/pathfinding/search?q=query&limit=10
 */
export const searchPages = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    const results = sdowService.searchPages(q, parseInt(limit));

    res.json({
      query: q,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching pages:", error);
    res.status(500).json({
      error: "Failed to search pages",
      message: error.message,
    });
  }
};

/**
 * Get a random article
 * GET /api/pathfinding/random
 */
export const getRandomArticle = async (req, res) => {
  try {
    const article = sdowService.getRandomPage();

    if (!article) {
      return res.status(404).json({
        error: "No articles found",
      });
    }

    res.json(article);
  } catch (error) {
    console.error("Error getting random article:", error);
    res.status(500).json({
      error: "Failed to get random article",
      message: error.message,
    });
  }
};

/**
 * Get database statistics
 * GET /api/pathfinding/stats
 */
export const getDatabaseStats = async (req, res) => {
  try {
    const stats = sdowService.getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting database stats:", error);
    res.status(500).json({
      error: "Failed to get database stats",
      message: error.message,
    });
  }
};

/**
 * Get neighbors of a specific node
 * POST /api/pathfinding/get-neighbors
 * Body: { title: "Article_Title", max_neighbors: 10 }
 */
export const getNeighbors = async (req, res) => {
  try {
    const { title } = req.body;
    let { max_neighbors } = req.body;

    // Interpret non-positive or missing max_neighbors as 'no limit'
    max_neighbors = parseInt(max_neighbors);
    if (isNaN(max_neighbors) || max_neighbors <= 0) {
      max_neighbors = null;
    }

    if (!title) {
      return res.status(400).json({
        error: "Article title is required",
      });
    }

    console.log(`Getting neighbors for "${title}" (max_neighbors=${max_neighbors})`);

    const result = pathfindingService.getNodeNeighbors(title, max_neighbors);

    res.json(result);
  } catch (error) {
    console.error("Error getting neighbors:", error);
    res.status(500).json({
      error: "Failed to get neighbors",
      message: error.message,
    });
  }
};

export default {
  findPath,
  buildGraph,
  lookupPage,
  searchPages,
  getRandomArticle,
  getDatabaseStats,
  getNeighbors,
};
