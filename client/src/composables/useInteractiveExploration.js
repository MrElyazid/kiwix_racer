import { ref, computed } from "vue";
import { createPathNodes, createPathLinks } from "@/utils/graphHelpers";

/**
 * Composable for interactive exploration (GameTree mode)
 * Manages exploration path, target detection, and visualization updates
 */
export function useInteractiveExploration() {
  const isInteractiveMode = ref(false);
  const explorationPath = ref([]);
  const targetFound = ref(false);
  const maxNeighbors = ref(200);
  const nodes = ref([]);
  const links = ref([]);

  const isExploring = computed(
    () => isInteractiveMode.value && explorationPath.value.length > 0
  );

  /**
   * Start interactive exploration from source article
   * @param {Object} sourceArticle - Source article object
   */
  function startExploration(sourceArticle) {
    isInteractiveMode.value = true;
    targetFound.value = false;
    explorationPath.value = [sourceArticle];

    nodes.value = [
      {
        id: sourceArticle.id || sourceArticle.title,
        title: sourceArticle.title,
        isExplorationRoot: true,
        inPath: true,
      },
    ];
    links.value = [];
  }

  /**
   * Handle node click in interactive mode
   * @param {Object} clickedNode - Clicked node data
   * @param {Function} getNeighborsAPI - API function to get neighbors
   * @param {Object} selectedTarget - Target article object
   * @returns {Object} Result containing node and neighbors
   */
  async function handleNodeClick(clickedNode, getNeighborsAPI, selectedTarget) {
    const result = await getNeighborsAPI(clickedNode.title, maxNeighbors.value);

    if (!result || !result.neighbors || result.neighbors.length === 0) {
      throw new Error("No neighbors found for this article");
    }

    // Find clicked node in path
    const clickedIndex = explorationPath.value.findIndex(
      (n) => n.title === clickedNode.title
    );

    if (clickedIndex !== -1) {
      // Truncate path to clicked node
      explorationPath.value = explorationPath.value.slice(0, clickedIndex + 1);
    } else {
      // Add new node to path
      explorationPath.value.push({
        id: result.node.id,
        title: result.node.title,
      });
    }

    // Check if target reached
    if (selectedTarget && result.node.title === selectedTarget.title) {
      targetFound.value = true;
    }

    // Update visualization
    updateVisualization(result, selectedTarget);

    return result;
  }

  /**
   * Jump to a specific node in the path
   * @param {Object} node - Node to jump to
   * @param {number} index - Index in exploration path
   * @param {Function} getNeighborsAPI - API function to get neighbors
   * @param {Object} selectedTarget - Target article object
   */
  async function jumpToNode(node, index, getNeighborsAPI, selectedTarget) {
    const result = await getNeighborsAPI(node.title, maxNeighbors.value);

    if (!result || !result.neighbors || result.neighbors.length === 0) {
      throw new Error("No neighbors found for this article");
    }

    // Truncate path to this node
    explorationPath.value = explorationPath.value.slice(0, index + 1);

    // Update visualization
    updateVisualization(result, selectedTarget);

    return result;
  }

  /**
   * Update visualization with new neighbors
   * @param {Object} result - Result from getNeighbors API
   * @param {Object} selectedTarget - Target article object
   */
  function updateVisualization(result, selectedTarget) {
    // Create path nodes
    const pathNodes = createPathNodes(explorationPath.value, selectedTarget);

    // Create neighbor nodes
    const neighborNodes = result.neighbors.map((neighbor) => ({
      id: neighbor.id,
      title: neighbor.title,
      isNeighbor: true,
    }));

    nodes.value = [...pathNodes, ...neighborNodes];

    // Create path links
    const pathLinks = createPathLinks(explorationPath.value);

    // Create neighbor links
    const neighborLinks = result.links.map((link) => ({
      source: link.source,
      target: link.target,
      isNeighborLink: true,
    }));

    links.value = [...pathLinks, ...neighborLinks];
  }

  /**
   * Reset exploration state
   */
  function reset() {
    isInteractiveMode.value = false;
    explorationPath.value = [];
    targetFound.value = false;
    nodes.value = [];
    links.value = [];
  }

  return {
    // State
    isInteractiveMode,
    explorationPath,
    targetFound,
    maxNeighbors,
    nodes,
    links,
    isExploring,

    // Methods
    startExploration,
    handleNodeClick,
    jumpToNode,
    updateVisualization,
    reset,
  };
}
