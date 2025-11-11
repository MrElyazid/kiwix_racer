/**
 * useGraphVisualization Composable
 * Manages graph data and interactions for Wikipedia link visualization
 */

import { ref, computed } from "vue";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

export function useGraphVisualization() {
  // Graph data
  const nodes = ref([]);
  const links = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Pathfinding data
  const pathResult = ref(null);
  const pathLoading = ref(false);
  const pathError = ref(null);

  // Search data
  const searchResults = ref([]);

  /**
   * Build graph structure around an article
   * @param {string} rootTitle - Root article title
   * @param {number} maxDepth - Maximum depth to explore
   * @param {number} maxNodes - Maximum nodes to return
   */
  async function buildGraph(rootTitle, maxDepth = 2, maxNodes = 50) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await axios.post(`${API_URL}/pathfinding/build-graph`, {
        root: rootTitle,
        max_depth: maxDepth,
        max_nodes: maxNodes,
        max_neighbors_per_node: 20,
      });

      nodes.value = response.data.nodes;
      links.value = response.data.links;

      return response.data;
    } catch (err) {
      error.value =
        err.response?.data?.message || err.message || "Failed to build graph";
      console.error("Error building graph:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Find shortest path between two articles
   * @param {string} sourceTitle - Source article title
   * @param {string} targetTitle - Target article title
   * @param {number} maxDepth - Maximum search depth
   */
  async function findPath(sourceTitle, targetTitle, maxDepth = 6) {
    pathLoading.value = true;
    pathError.value = null;
    pathResult.value = null;

    try {
      const response = await axios.post(`${API_URL}/pathfinding/find-path`, {
        source: sourceTitle,
        target: targetTitle,
        max_depth: maxDepth,
      });

      pathResult.value = response.data;

      // Convert path to graph visualization format
      if (response.data.path && response.data.path.length > 0) {
        const pathNodes = response.data.path.map((pageId, index) => {
          const page = response.data.pages[pageId];
          return {
            id: pageId,
            title: page.title,
            depth: index,
            isPath: true,
            isSource: index === 0,
            isTarget: index === response.data.path.length - 1,
          };
        });

        const pathLinks = [];
        for (let i = 0; i < response.data.path.length - 1; i++) {
          pathLinks.push({
            source: response.data.path[i],
            target: response.data.path[i + 1],
            isPath: true,
          });
        }

        nodes.value = pathNodes;
        links.value = pathLinks;
      }

      return response.data;
    } catch (err) {
      pathError.value =
        err.response?.data?.message || err.message || "Failed to find path";
      console.error("Error finding path:", err);
      throw err;
    } finally {
      pathLoading.value = false;
    }
  }

  /**
   * Search for Wikipedia articles
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   */
  async function searchArticles(query, limit = 10) {
    if (!query || query.length < 2) {
      searchResults.value = [];
      return [];
    }

    try {
      const response = await axios.get(`${API_URL}/pathfinding/search`, {
        params: { q: query, limit },
      });

      searchResults.value = response.data.results || [];
      return searchResults.value;
    } catch (err) {
      console.error("Error searching articles:", err);
      searchResults.value = [];
      return [];
    }
  }

  /**
   * Get a random Wikipedia article
   */
  async function getRandomArticle() {
    try {
      const response = await axios.get(`${API_URL}/pathfinding/random`);
      return response.data;
    } catch (err) {
      console.error("Error getting random article:", err);
      throw err;
    }
  }

  /**
   * Get database statistics
   */
  async function getDatabaseStats() {
    try {
      const response = await axios.get(`${API_URL}/pathfinding/stats`);
      return response.data;
    } catch (err) {
      console.error("Error getting database stats:", err);
      throw err;
    }
  }

  /**
   * Clear graph data
   */
  function clearGraph() {
    nodes.value = [];
    links.value = [];
    error.value = null;
  }

  /**
   * Clear path data
   */
  function clearPath() {
    pathResult.value = null;
    pathError.value = null;
  }

  // Computed properties
  const nodeCount = computed(() => nodes.value.length);
  const linkCount = computed(() => links.value.length);
  const hasGraph = computed(() => nodes.value.length > 0);
  const hasPath = computed(() => pathResult.value && pathResult.value.path);
  const pathDegrees = computed(() => pathResult.value?.degrees || 0);
  const pathDuration = computed(() => pathResult.value?.duration_ms || 0);

  // Get path as array of node IDs
  const path = computed(() => pathResult.value?.path || []);

  // Get path info for display
  const pathInfo = computed(() => {
    if (!pathResult.value) return null;
    return {
      degrees: pathResult.value.degrees,
      duration_ms: pathResult.value.duration_ms,
    };
  });

  // Get graph info for display
  const graphInfo = computed(() => {
    if (nodes.value.length === 0) return null;
    return {
      node_count: nodes.value.length,
      link_count: links.value.length,
    };
  });

  return {
    // State
    nodes,
    links,
    isLoading,
    error,
    pathResult,
    pathLoading,
    pathError,
    searchResults,
    path,
    pathInfo,
    graphInfo,

    // Computed
    nodeCount,
    linkCount,
    hasGraph,
    hasPath,
    pathDegrees,
    pathDuration,

    // Methods
    buildGraph,
    findPath,
    searchArticles,
    getRandomArticle,
    getDatabaseStats,
    clearGraph,
    clearPath,
  };
}
