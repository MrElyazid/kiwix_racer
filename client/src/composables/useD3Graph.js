import { ref } from "vue";
import * as d3 from "d3";

/**
 * Composable for D3 graph visualization
 * Handles force simulation, rendering, and interactions
 */
export function useD3Graph() {
  let simulation = null;
  let svg = null;
  let g = null;
  let linkElements = null;
  let nodeElements = null;
  let labelElements = null;

  const isInitialized = ref(false);

  /**
   * Initialize D3 visualization in container
   * @param {HTMLElement} container - DOM element to render SVG in
   * @param {number} width - Container width
   * @param {number} height - Container height
   */
  function initVisualization(container, width, height) {
    if (!container) return;

    // Create SVG
    svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Define arrow markers
    const defs = svg.append("defs");

    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    defs
      .append("marker")
      .attr("id", "arrowhead-path")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#ff6b6b");

    // Create group for graph elements
    g = svg.append("g");

    // Setup zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.id)
          .distance(150)
          .strength(0.5)
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    isInitialized.value = true;
  }

  /**
   * Update visualization with new data
   * @param {Array} nodes - Array of node objects
   * @param {Array} links - Array of link objects
   * @param {Array} path - Array of node IDs in path
   * @param {Object} config - Configuration object
   */
  function updateVisualization(nodes, links, path, config) {
    if (!svg || !g || nodes.length === 0) return;

    const {
      isInteractiveMode = false,
      selectedSource = null,
      selectedTarget = null,
      targetFound = false,
      onNodeClick = () => {},
    } = config;

    // Update links
    const linkSelection = g
      .selectAll(".link")
      .data(
        links,
        (d) => `${d.source.id || d.source}-${d.target.id || d.target}`
      );

    linkSelection.exit().remove();

    linkElements = linkSelection
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", (d) => getLinkColor(d, path))
      .attr("stroke-width", (d) => getLinkWidth(d, path))
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", (d) => getLinkMarker(d, path))
      .merge(linkSelection);

    // Update nodes
    const nodeSelection = g.selectAll(".node").data(nodes, (d) => d.id);

    nodeSelection.exit().remove();

    const nodeEnter = nodeSelection
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", (d) => getNodeRadius(d, selectedSource, selectedTarget, targetFound))
      .attr("fill", (d) =>
        getNodeColor(d, path, selectedSource, selectedTarget, targetFound)
      )
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .call(getDragBehavior())
      .on("click", onNodeClick);

    nodeElements = nodeEnter.merge(nodeSelection);

    // Update labels
    const labelSelection = g.selectAll(".label").data(nodes, (d) => d.id);

    labelSelection.exit().remove();

    const labelEnter = labelSelection
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("dy", -15)
      .attr("font-size", (d) => getLabelSize(d))
      .attr("font-weight", (d) => getLabelWeight(d))
      .attr("fill", "#333")
      .style("cursor", "pointer")
      .text((d) => d.title)
      .on("click", onNodeClick);

    labelElements = labelEnter.merge(labelSelection);

    // Update simulation
    try {
      simulation.nodes(nodes);
      simulation.force("link").links(links);
      simulation.alpha(0.3).restart();
    } catch (err) {
      console.error("Error updating simulation:", err);
      return;
    }

    // Tick function
    simulation.on("tick", () => {
      try {
        if (linkElements) {
          linkElements
            .attr("x1", (d) => (d.source && d.source.x) || 0)
            .attr("y1", (d) => (d.source && d.source.y) || 0)
            .attr("x2", (d) => (d.target && d.target.x) || 0)
            .attr("y2", (d) => (d.target && d.target.y) || 0);
        }

        if (nodeElements) {
          nodeElements.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0);
        }

        if (labelElements) {
          labelElements.attr("x", (d) => d.x || 0).attr("y", (d) => d.y || 0);
        }
      } catch (err) {
        // Suppress tick errors
      }
    });
  }

  /**
   * Center view and reset zoom
   */
  function centerView() {
    if (!svg) return;

    const container = svg.node().parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    svg
      .transition()
      .duration(750)
      .call(d3.zoom().transform, d3.zoomIdentity.translate(0, 0).scale(1));

    if (simulation) {
      simulation.force("center", d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.3).restart();
    }
  }

  /**
   * Clean up D3 resources
   */
  function cleanup() {
    // Stop simulation
    if (simulation) {
      try {
        simulation.stop();
        simulation.on("tick", null);
      } catch (err) {
        // ignore
      }
      simulation = null;
    }

    // Remove SVG
    if (svg) {
      try {
        svg.selectAll("*").remove();
        svg.remove();
      } catch (err) {
        // ignore
      }
      svg = null;
      g = null;
      linkElements = null;
      nodeElements = null;
      labelElements = null;
    }

    isInitialized.value = false;
  }

  /**
   * Get drag behavior for nodes
   */
  function getDragBehavior() {
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded);
  }

  // Styling helper functions

  function getLinkColor(d, path) {
    if (d.isPath) return "#ff6b6b";
    if (d.isNeighborLink) return "#999";
    const pathIds = new Set(path);
    const sourceId = d.source.id || d.source;
    const targetId = d.target.id || d.target;
    return pathIds.has(sourceId) && pathIds.has(targetId) ? "#ff6b6b" : "#999";
  }

  function getLinkWidth(d, path) {
    if (d.isPath) return 3;
    if (d.isNeighborLink) return 1;
    const pathIds = new Set(path);
    const sourceId = d.source.id || d.source;
    const targetId = d.target.id || d.target;
    return pathIds.has(sourceId) && pathIds.has(targetId) ? 3 : 1;
  }

  function getLinkMarker(d, path) {
    if (d.isPath) return "url(#arrowhead-path)";
    if (d.isNeighborLink) return "url(#arrowhead)";
    const pathIds = new Set(path);
    const sourceId = d.source.id || d.source;
    const targetId = d.target.id || d.target;
    return pathIds.has(sourceId) && pathIds.has(targetId)
      ? "url(#arrowhead-path)"
      : "url(#arrowhead)";
  }

  function getNodeRadius(d, selectedSource, selectedTarget, targetFound) {
    if (d.isTargetNode && targetFound) return 16;
    if (d.isExplorationRoot) return 14;
    if (d.isCurrentNode) return 12;
    if (d.inPath) return 10;
    if (selectedSource && d.id === selectedSource.id) return 12;
    if (selectedTarget && d.id === selectedTarget.id) return 12;
    return 8;
  }

  function getNodeColor(d, path, selectedSource, selectedTarget, targetFound) {
    // GameTree mode
    if (d.isTargetNode && targetFound) return "#FFD700";
    if (d.isExplorationRoot) return "#4CAF50";
    if (d.isCurrentNode) return "#ff6b6b";
    if (d.inPath) return "#ff6b6b";
    if (d.isNeighbor) return "#69b3a2";

    // Find Path mode
    const pathIds = new Set(path);
    if (pathIds.has(d.id)) {
      if (selectedTarget && d.id === selectedTarget.id) return "#2196F3";
      if (selectedSource && d.id === selectedSource.id) return "#4CAF50";
      return "#ff6b6b";
    }
    if (selectedSource && d.id === selectedSource.id) return "#4CAF50";
    if (selectedTarget && d.id === selectedTarget.id) return "#2196F3";
    return "#69b3a2";
  }

  function getLabelSize(d) {
    if (d.isExplorationRoot || d.isCurrentNode) return "8px";
    if (d.inPath) return "7px";
    return "6px";
  }

  function getLabelWeight(d) {
    if (d.isExplorationRoot || d.isCurrentNode || d.inPath) return "700";
    return "500";
  }

  return {
    // State
    isInitialized,

    // Methods
    initVisualization,
    updateVisualization,
    centerView,
    cleanup,
  };
}
