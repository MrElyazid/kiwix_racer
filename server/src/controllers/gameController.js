/**
 * Game Controller
 * Handles game-related requests
 */

/**
 * Start a new game session
 */
export const startGame = async (req, res) => {
  try {
    const { startArticle, targetArticle, archive } = req.body;

    // TODO: Validate articles exist
    // TODO: Generate game session ID

    res.json({
      gameId: "game_" + Date.now(),
      startArticle: startArticle || "Random_Start",
      targetArticle: targetArticle || "Random_Target",
      archive: archive || "default",
      startTime: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Validate a path between two articles
 */
export const validatePath = async (req, res) => {
  try {
    const { gameId, path } = req.body;

    if (!path || !Array.isArray(path)) {
      return res
        .status(400)
        .json({ error: "Path must be an array of article titles" });
    }

    // TODO: Validate each link in the path exists
    // TODO: Calculate score based on path length and time

    res.json({
      gameId,
      valid: true,
      pathLength: path.length,
      score: 100,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get shortest path between two articles using graph algorithms
 */
export const getShortestPath = async (req, res) => {
  try {
    const { from, to } = req.params;
    const { archive } = req.query;

    // TODO: Implement BFS or other pathfinding algorithm
    // TODO: Query SQLite database for link relationships

    res.json({
      from,
      to,
      path: [from, "intermediate", to],
      length: 3,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
