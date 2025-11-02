/**
 * Pathfinding Service
 * Implements graph algorithms to find shortest paths between articles
 */

class PathfindingService {
  /**
   * Find shortest path using BFS (Breadth-First Search)
   * @param {string} start - Starting article title
   * @param {string} target - Target article title
   * @param {Function} getNeighbors - Function to get neighboring articles
   */
  async findShortestPath(start, target, getNeighbors) {
    if (start === target) {
      return [start];
    }

    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      // Get neighbors (linked articles)
      const neighbors = await getNeighbors(current);

      for (const neighbor of neighbors) {
        if (neighbor === target) {
          return [...path, neighbor];
        }

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Find path with depth limit (for performance)
   * @param {string} start - Starting article
   * @param {string} target - Target article
   * @param {Function} getNeighbors - Function to get neighbors
   * @param {number} maxDepth - Maximum search depth
   */
  async findPathWithLimit(start, target, getNeighbors, maxDepth = 6) {
    if (start === target) {
      return [start];
    }

    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length > 0) {
      const path = queue.shift();

      if (path.length > maxDepth) {
        continue;
      }

      const current = path[path.length - 1];
      const neighbors = await getNeighbors(current);

      for (const neighbor of neighbors) {
        if (neighbor === target) {
          return [...path, neighbor];
        }

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null;
  }
}

export default new PathfindingService();
