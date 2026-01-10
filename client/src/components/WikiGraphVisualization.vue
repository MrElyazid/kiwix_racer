<template>
  <div class="graph-visualization">
    <!-- Compact Control Panel Overlay -->
    <div class="control-panel" :class="{ collapsed: isPanelCollapsed }">
      <div class="panel-header">
        <h3 class="panel-title">Graph Controls</h3>
        <button
          @click="isPanelCollapsed = !isPanelCollapsed"
          class="toggle-btn"
        >
          {{ isPanelCollapsed ? "▼" : "▲" }}
        </button>
      </div>

      <div v-if="!isPanelCollapsed" class="panel-content">
        <!-- Search Section -->
        <div class="control-section">
          <div class="search-box">
            <input
              :value="searchQuery"
              @input="onSearchInput"
              type="text"
              placeholder="Search articles..."
              class="search-input"
            />
          </div>

          <div v-if="searchResults.length > 0" class="search-results">
            <div
              v-for="result in searchResults"
              :key="result.id"
              @click="selectArticle(result)"
              class="search-result-item"
            >
              {{ result.title }}
            </div>
          </div>
        </div>

        <!-- Selected Articles -->
        <div v-if="selectedSource || selectedTarget" class="control-section">
          <div class="selected-articles">
            <div v-if="selectedSource" class="selected-item source">
              <span class="label">From:</span>
              <span class="value">{{ selectedSource.title }}</span>
              <button @click="selectedSource = null" class="btn-remove">
                ×
              </button>
            </div>
            <div v-if="selectedTarget" class="selected-item target">
              <span class="label">To:</span>
              <span class="value">{{ selectedTarget.title }}</span>
              <button @click="selectedTarget = null" class="btn-remove">
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="control-section">
          <div class="action-grid">
            <button
              @click="findPath"
              :disabled="!canFindPath || isLoading"
              class="btn-action btn-primary"
              title="Find shortest path between selected articles"
            >
              {{ isLoading ? "Finding..." : "Find Path" }}
            </button>
            <button
              @click="buildGraph"
              :disabled="!selectedSource || isLoading"
              class="btn-action btn-secondary"
              title="Build graph from selected article"
            >
              {{ isLoading ? "Building..." : "Build Graph" }}
            </button>
            <button
              @click="startInteractiveExploration"
              :disabled="!selectedSource || isLoading"
              class="btn-action btn-secondary"
              :class="{ 'btn-active': isInteractiveMode }"
              title="Interactive exploration mode"
            >
              {{ isInteractiveMode ? "Exploring..." : "Tree" }}
            </button>
            <button
              @click="getRandomAndBuildGraph"
              :disabled="isLoading"
              class="btn-action btn-secondary"
              title="Get random article and build its graph"
            >
              Random
            </button>
            <button
              @click="centerView"
              class="btn-action btn-secondary"
              title="Reset view to center"
            >
              Center View
            </button>
            <button @click="clearVisualization" class="btn-action btn-clear">
              Clear
            </button>
          </div>
        </div>

        <!-- Interactive Mode Info removed: using minimal controls for Tree mode -->

        <!-- Status Messages -->
        <div class="control-section">
          <div v-if="error" class="message error">{{ error }}</div>
          <div v-if="pathInfo" class="message success">
            Path found! <strong>{{ pathInfo.degrees }}</strong> degrees ({{
              pathInfo.duration_ms
            }}ms)
          </div>
          <div v-if="graphInfo" class="message info">
            <strong>{{ graphInfo.node_count }}</strong> nodes ·
            <strong>{{ graphInfo.link_count }}</strong> links
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen Graph Container -->
    <div ref="graphContainer" class="graph-container"></div>
    
    <!-- Use shared GameNotification modal for congratulations -->
    <GameNotification
      :show="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      :stats="notification.stats"
      :show-play-again="notification.showPlayAgain"
      @close="closeNotification"
      @play-again="playAgain"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import * as d3 from "d3";
import { useGraphVisualization } from "@/composables/useGraphVisualization";
import GameNotification from "@/components/singleplayer/GameNotification.vue";

const graphContainer = ref(null);
const searchQuery = ref("");
const selectedSource = ref(null);
const selectedTarget = ref(null);
const isPanelCollapsed = ref(false);

// Interactive exploration state
const isInteractiveMode = ref(false);
const explorationPath = ref([]);
const maxNeighbors = 10;
const targetFound = ref(false);
const notification = ref({
  show: false,
  type: "info",
  title: "",
  message: "",
  stats: null,
  showPlayAgain: false,
});

const timerStart = ref(null);
const elapsedMs = ref(0);
let timerIntervalId = null;

function startTimer() {
  if (timerStart.value) return;
  timerStart.value = Date.now();
  elapsedMs.value = 0;
  timerIntervalId = setInterval(() => {
    elapsedMs.value = Date.now() - timerStart.value;
  }, 100);
}

function stopTimer() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  if (timerStart.value) {
    elapsedMs.value = Date.now() - timerStart.value;
  }
  timerStart.value = null;
}

function resetTimer() {
  stopTimer();
  elapsedMs.value = 0;
}

function formatMsToMinutesSeconds(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function closeNotification() {
  notification.value.show = false;
  targetFound.value = false;
  resetTimer();
}

function playAgain() {
  notification.value.show = false;
  clearVisualization();
  resetTimer();
}

const {
  nodes,
  links,
  path,
  searchResults,
  isLoading,
  error,
  pathInfo,
  graphInfo,
  buildGraph: buildGraphAPI,
  findPath: findPathAPI,
  getNeighbors: getNeighborsAPI,
  searchArticles: searchArticlesAPI,
  getRandomArticle,
  clearGraph,
  clearPath,
} = useGraphVisualization();

let simulation = null;
let svg = null;
let g = null;
let linkElements = null;
let nodeElements = null;
let labelElements = null;
let searchTimeout = null;

const canFindPath = computed(
  () => selectedSource.value && selectedTarget.value
);

const searchArticles = async () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    await searchArticlesAPI(searchQuery.value);
  }, 300);
};

const onSearchInput = (e) => {
  const el = e.target;
  const old = el.value;
  const caretPos = el.selectionStart;

  const newVal = old.replace(/\s+/g, "_");

  if (newVal !== old) {
    searchQuery.value = newVal;
    nextTick(() => {
      const diff = newVal.length - old.length;
      const newPos = Math.max(0, caretPos + diff);
      try {
        el.setSelectionRange(newPos, newPos);
      } catch (err) {
        // ignore
      }
    });
  } else {
    searchQuery.value = newVal;
  }

  searchArticles();
};

const selectArticle = (article) => {
  if (!selectedSource.value) {
    selectedSource.value = article;
  } else if (!selectedTarget.value) {
    selectedTarget.value = article;
  } else {
    selectedSource.value = article;
    selectedTarget.value = null;
  }
  searchQuery.value = "";
  searchResults.value = [];
};

const findPath = async () => {
  if (!canFindPath.value || isLoading.value) return;
  
  // Désactiver le mode interactif
  isInteractiveMode.value = false;
  explorationPath.value = [];
  
  await findPathAPI(selectedSource.value.title, selectedTarget.value.title);
};

const buildGraph = async () => {
  if (!selectedSource.value || isLoading.value) return;
  
  // Désactiver le mode interactif
  isInteractiveMode.value = false;
  explorationPath.value = [];
  
  await buildGraphAPI(selectedSource.value.title, 2, 100);
};

const getRandomAndBuildGraph = async () => {
  const article = await getRandomArticle();
  if (article) {
    selectedSource.value = article;
    isInteractiveMode.value = false;
    explorationPath.value = [];
    await buildGraphAPI(article.title, 2, 100);
  }
};

const startInteractiveExploration = async () => {
  if (!selectedSource.value) return;
  
  clearGraph();
  clearPath();
  resetTimer();
  isInteractiveMode.value = true;
  targetFound.value = false;
  explorationPath.value = [selectedSource.value];

  nodes.value = [
    {
      id: selectedSource.value.id || selectedSource.value.title,
      title: selectedSource.value.title,
      isExplorationRoot: true,
      inPath: true,
    },
  ];
  links.value = [];

  nextTick(() => {
    try {
      updateVisualization();
    } catch (err) {
      console.error("Visualization error:", err);
    }
    centerView();
  });
};

const handleNodeClickInteractive = async (event, d) => {
  // Toujours empêcher la propagation pour éviter les clics multiples
  event.stopPropagation();
  event.preventDefault();
  
  if (!isInteractiveMode.value) {
    const clean = (s) => (s ? s.replace(/\\'/g, "'").replace(/\\/g, "") : s);
    const articleTitle = encodeURIComponent(clean(d.title).replace(/ /g, "_"));
    const url = `https://en.wikipedia.org/wiki/${articleTitle}`;
    window.open(url, "_blank");
    return;
  }

  if (isInteractiveMode.value && !timerStart.value) {
    startTimer();
  }

  try {
    isLoading.value = true;
    error.value = null;

    const result = await getNeighborsAPI(d.title, maxNeighbors);

    if (!result || !result.neighbors || result.neighbors.length === 0) {
      error.value = "No neighbors found for this article";
      isLoading.value = false;
      return;
    }

    const clickedIndex = explorationPath.value.findIndex(
      n => (n.id || n.title) === (d.id || d.title)
    );

    if (clickedIndex !== -1) {
      explorationPath.value = explorationPath.value.slice(0, clickedIndex + 1);
    } else {
      explorationPath.value.push({
        id: result.node.id,
        title: result.node.title,
      });
    }

    // Vérifier si on a atteint la cible
    if (
      selectedTarget.value &&
      (result.node.id === selectedTarget.value.id || result.node.title === selectedTarget.value.title)
    ) {
      targetFound.value = true;
      stopTimer();
      notification.value = {
        show: true,
        type: "success",
        title: "Congratulations!",
        message: `You reached the target article!`,
        stats: {
          clicks: Math.max(0, explorationPath.value.length - 1),
          time: formatMsToMinutesSeconds(elapsedMs.value),
        },
        showPlayAgain: true,
      };
    }

    const pathNodes = explorationPath.value.map((node, index) => ({
      id: node.id || node.title,
      title: node.title,
      inPath: true,
      isExplorationRoot: index === 0,
      isCurrentNode: index === explorationPath.value.length - 1,
      isTargetNode: selectedTarget.value && 
                    (node.id === selectedTarget.value.id || 
                     node.title === selectedTarget.value.title),
      x: d.x,
      y: d.y
    }));

    const neighborNodes = result.neighbors.map(neighbor => ({
      id: neighbor.id,
      title: neighbor.title,
      isNeighbor: true,
      x: d.x,
      y: d.y
    }));

    nodes.value = [...pathNodes, ...neighborNodes];

    const pathLinks = [];
    for (let i = 0; i < explorationPath.value.length - 1; i++) {
      pathLinks.push({
        source: explorationPath.value[i].id || explorationPath.value[i].title,
        target: explorationPath.value[i + 1].id || explorationPath.value[i + 1].title,
        isPath: true,
      });
    }

    const neighborLinks = result.links.map(link => ({
      source: link.source,
      target: link.target,
      isNeighborLink: true,
    }));

    links.value = [...pathLinks, ...neighborLinks];

    nextTick(() => {
      try {
        updateVisualization();
      } catch (err) {
        console.error("Visualization error:", err);
      }
    });

  } catch (err) {
    error.value = err.message || "Failed to get neighbors";
    console.error("Error getting neighbors:", err);
  } finally {
    isLoading.value = false;
  }
};

const clearVisualization = () => {
  clearGraph();
  clearPath();
  selectedSource.value = null;
  selectedTarget.value = null;
  searchQuery.value = "";
  isInteractiveMode.value = false;
  explorationPath.value = [];
  targetFound.value = false;
  resetTimer();
  
  if (svg) {
    try {
      svg.remove();
    } catch (err) {
      // ignore
    }
    svg = null;
    g = null;
    linkElements = null;
    nodeElements = null;
    labelElements = null;

    if (simulation) {
      try {
        simulation.stop();
      } catch (err) {
        // ignore
      }
      simulation = null;
    }

    nextTick(() => {
      initVisualization();
    });
  }
};

const centerView = () => {
  if (!svg || !graphContainer.value) return;

  const width = graphContainer.value.clientWidth;
  const height = graphContainer.value.clientHeight;

  svg
    .transition()
    .duration(750)
    .call(d3.zoom().transform, d3.zoomIdentity.translate(0, 0).scale(1));

  if (simulation) {
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.alpha(0.3).restart();
  }
};

const initVisualization = () => {
  if (!graphContainer.value) return;

  const width = graphContainer.value.clientWidth;
  const height = graphContainer.value.clientHeight;

  svg = d3
    .select(graphContainer.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

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

  g = svg.append("g");

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id((d) => d.id)
        .distance((d) => (d && d.isPath ? 60 : 100))
        .strength((d) => (d && d.isPath ? 1 : 0.2))
    )
    .force("charge", d3.forceManyBody().strength((d) => (d && d.inPath ? -80 : -300)))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius((d) => (d && d.inPath ? 20 : 30)));
};

const updateVisualization = () => {
  if (!svg || !g || nodes.value.length === 0) return;

  const linkSelection = g
    .selectAll(".link")
    .data(
      links.value,
      (d) => `${d.source.id || d.source}-${d.target.id || d.target}`
    );

  linkSelection.exit().remove();

  linkElements = linkSelection
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", (d) => {
      if (d.isPath) return "#ff6b6b";
      if (d.isNeighborLink) return "#999";
      const pathIds = new Set(path.value);
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      return pathIds.has(sourceId) && pathIds.has(targetId) ? "#ff6b6b" : "#999";
    })
    .attr("stroke-width", (d) => {
      if (d.isPath) return 3;
      if (d.isNeighborLink) return 1;
      const pathIds = new Set(path.value);
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      return pathIds.has(sourceId) && pathIds.has(targetId) ? 3 : 1;
    })
    .attr("stroke-opacity", 0.6)
    .attr("marker-end", (d) => {
      if (d.isPath) return "url(#arrowhead-path)";
      if (d.isNeighborLink) return "url(#arrowhead)";
      const pathIds = new Set(path.value);
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      return pathIds.has(sourceId) && pathIds.has(targetId)
        ? "url(#arrowhead-path)"
        : "url(#arrowhead)";
    })
    .merge(linkSelection);

  const nodeSelection = g.selectAll(".node").data(nodes.value, (d) => d.id);

  nodeSelection.exit().remove();

  const nodeEnter = nodeSelection
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", (d) => {
      if (d.isTargetNode && targetFound.value) return 16; // Plus gros pour la cible trouvée!
      if (d.isExplorationRoot) return 14;
      if (d.isCurrentNode) return 12;
      if (d.inPath) return 10;
      if (selectedSource.value && d.id === selectedSource.value.id) return 12;
      if (selectedTarget.value && d.id === selectedTarget.value.id) return 12;
      return 8;
    })
    .attr("fill", (d) => {
      // Mode Tree (Interactive)
      if (d.isTargetNode && targetFound.value) return "#FFD700"; // Or brillant pour la cible trouvée!
      if (d.isExplorationRoot) return "#4CAF50"; // Même vert que source en Find Path
      if (d.isCurrentNode) return "#ff6b6b"; // Même rouge que le chemin
      if (d.inPath) return "#ff6b6b"; // Rouge pour le chemin parcouru
      if (d.isNeighbor) return "#69b3a2"; // Voisins en vert-bleu
      
      // Mode Find Path
      const pathIds = new Set(path.value);
      if (pathIds.has(d.id)) {
        if (selectedTarget.value && d.id === selectedTarget.value.id) return "#2196F3";
        if (selectedSource.value && d.id === selectedSource.value.id) return "#4CAF50";
        return "#ff6b6b";
      }
      if (selectedSource.value && d.id === selectedSource.value.id) return "#4CAF50";
      if (selectedTarget.value && d.id === selectedTarget.value.id) return "#2196F3";
      return "#69b3a2";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .call(
      d3
        .drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded)
    )
    .on("click", handleNodeClickInteractive);

  nodeElements = nodeEnter.merge(nodeSelection);

  const labelSelection = g.selectAll(".label").data(nodes.value, (d) => d.id);

  labelSelection.exit().remove();

  const labelEnter = labelSelection
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .attr("dy", -15)
    .attr("font-size", (d) => {
      if (d.isExplorationRoot || d.isCurrentNode) return "8px";
      if (d.inPath) return "7px";
      return "6px";
    })
    .attr("font-weight", (d) => {
      if (d.isExplorationRoot || d.isCurrentNode || d.inPath) return "700";
      return "500";
    })
    .attr("fill", "#333")
    .style("cursor", "pointer")
    .text((d) => d.title)
    .on("click", handleNodeClickInteractive);

  labelElements = labelEnter.merge(labelSelection);

  simulation.nodes(nodes.value);
  simulation.force("link").links(links.value);
  simulation.alpha(0.3).restart();

  simulation.on("tick", () => {
    linkElements
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    nodeElements.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

    labelElements.attr("x", (d) => d.x).attr("y", (d) => d.y);
  });
};

const dragStarted = (event, d) => {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
};

const dragged = (event, d) => {
  d.fx = event.x;
  d.fy = event.y;
};

const dragEnded = (event, d) => {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
};

watch(
  [nodes, links, path],
  () => {
    updateVisualization();
  },
  { deep: true }
);

onMounted(() => {
  initVisualization();
});

onBeforeUnmount(() => {
  if (simulation) {
    simulation.stop();
  }
});
</script>

<style scoped>
.graph-visualization {
  position: relative;
  height: 100%;
  width: 100%;
  background: #fafafa;
}

.control-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 320px;
  max-height: calc(100vh - 200px);
  background: rgba(255, 255, 255, 0.98);
  border: 2px solid #c2e2fa;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.3s ease;
  overflow: hidden;
}

.control-panel.collapsed {
  max-height: 60px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #c2e2fa 0%, #a8d5f7 100%);
  border-bottom: 2px solid #c2e2fa;
  cursor: pointer;
}

.panel-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.toggle-btn {
  background: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-btn:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

.panel-content {
  padding: 1rem;
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

.control-section {
  margin-bottom: 1rem;
}

.control-section:last-child {
  margin-bottom: 0;
}

.search-box {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 2px solid #c2e2fa;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
  outline: none;
}

.search-input:focus {
  border-color: #ff8f8f;
  box-shadow: 0 0 0 3px rgba(255, 143, 143, 0.1);
}

.search-results {
  max-height: 180px;
  overflow-y: auto;
  background: white;
  border: 2px solid #c2e2fa;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.search-result-item {
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: #c2e2fa;
  color: #1a1a1a;
}

.selected-articles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  background: white;
  border: 2px solid #c2e2fa;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.selected-item.source {
  border-color: #4caf50;
  background: #f1f8f4;
}

.selected-item.target {
  border-color: #2196f3;
  background: #f1f7fc;
}

.selected-item .label {
  font-weight: 700;
  color: #666;
  min-width: 40px;
}

.selected-item .value {
  flex: 1;
  font-weight: 500;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-remove {
  background: #ff8f8f;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: #ff6b6b;
  transform: scale(1.1);
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.6rem 0.8rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action.btn-primary {
  background: #4caf50;
  color: white;
  grid-column: 1 / -1;
}

.btn-action.btn-primary:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.btn-action.btn-secondary {
  background: #c2e2fa;
  color: #1a1a1a;
}

.btn-action.btn-secondary:hover:not(:disabled) {
  background: #a8d5f7;
  transform: translateY(-2px);
}

.btn-action.btn-secondary.btn-active {
  background: #ff6b6b;
  color: white;
  font-weight: 700;
  border: 2px solid #ff5252;
}

.btn-action.btn-clear {
  background: #ff8f8f;
  color: white;
}

.btn-action.btn-clear:hover {
  background: #ff6b6b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 143, 143, 0.3);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}


.message {
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
  animation: slideIn 0.3s ease;
}

.message:last-child {
  margin-bottom: 0;
}

.message.error {
  background: #ffebee;
  color: #c62828;
  border: 2px solid #ef5350;
}

.message.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 2px solid #4caf50;
}

.message.info {
  background: #e3f2fd;
  color: #1565c0;
  border: 2px solid #c2e2fa;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.graph-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
}

.link {
  pointer-events: none;
}

.node {
  cursor: pointer;
  transition: all 0.2s;
}

.node:hover {
  filter: brightness(1.2);
  stroke-width: 3px;
}

.label {
  pointer-events: all;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  font-size: 6px;
  transition: all 0.2s;
}

.label:hover {
  font-weight: 700;
  fill: #1a1a1a;
}

.panel-content::-webkit-scrollbar,
.search-results::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track,
.search-results::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb,
.search-results::-webkit-scrollbar-thumb {
  background: #c2e2fa;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover,
.search-results::-webkit-scrollbar-thumb:hover {
  background: #a8d5f7;
}
</style>
