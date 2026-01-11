<template>
  <div class="graph-visualization">
    <GraphControlPanel
      v-model:selected-source="selectedSource"
      v-model:selected-target="selectedTarget"
      :is-interactive-mode="exploration.isInteractiveMode.value"
      :is-loading="isLoading"
      :error="error"
      :path-info="pathInfo"
      :graph-info="graphInfo"
      @find-path="handleFindPath"
      @build-graph="handleBuildGraph"
      @random-graph="handleRandomGraph"
      @start-interactive="handleStartInteractive"
      @center-view="handleCenterView"
      @clear="handleClear"
    />

    <GraphCanvas
      ref="graphCanvasRef"
      :nodes="displayNodes"
      :links="displayLinks"
      :path="path"
      :is-interactive-mode="exploration.isInteractiveMode.value"
      :selected-source="selectedSource"
      :selected-target="selectedTarget"
      :target-found="exploration.targetFound.value"
      @node-click="handleNodeClick"
    />

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

    <ExplorationTimeline
      :exploration-path="exploration.explorationPath.value"
      :selected-target="selectedTarget"
      :is-interactive-mode="exploration.isInteractiveMode.value"
      @jump-to-node="handleJumpToNode"
    />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, nextTick } from "vue";
import GraphControlPanel from "@/components/explore/GraphControlPanel.vue";
import GraphCanvas from "@/components/explore/GraphCanvas.vue";
import ExplorationTimeline from "@/components/explore/ExplorationTimeline.vue";
import GameNotification from "@/components/singleplayer/GameNotification.vue";
import { useGraphVisualization } from "@/composables/useGraphVisualization";
import { useInteractiveExploration } from "@/composables/useInteractiveExploration";
import { useTimer } from "@/composables/useTimer";
import { getWikipediaUrl, formatMsToMinutesSeconds } from "@/utils/graphHelpers";

// API & Data
const {
  nodes,
  links,
  path,
  isLoading,
  error,
  pathInfo,
  graphInfo,
  buildGraph: buildGraphAPI,
  findPath: findPathAPI,
  getNeighbors: getNeighborsAPI,
  getRandomArticle,
  clearGraph,
  clearPath,
} = useGraphVisualization();

// Interactive Exploration
const exploration = useInteractiveExploration();

// Timer
const timer = useTimer();

// UI State
const selectedSource = ref(null);
const selectedTarget = ref(null);
const graphCanvasRef = ref(null);
const notification = ref({
  show: false,
  type: "info",
  title: "",
  message: "",
  stats: null,
  showPlayAgain: false,
});

// Computed
const displayNodes = computed(() =>
  exploration.isInteractiveMode.value ? exploration.nodes.value : nodes.value
);
const displayLinks = computed(() =>
  exploration.isInteractiveMode.value ? exploration.links.value : links.value
);

// Event Handlers

async function handleFindPath() {
  if (!selectedSource.value || !selectedTarget.value || isLoading.value) return;

  exploration.reset();
  await findPathAPI(selectedSource.value.title, selectedTarget.value.title);
}

async function handleBuildGraph() {
  if (!selectedSource.value || isLoading.value) return;

  exploration.reset();
  await buildGraphAPI(selectedSource.value.title, 2, 100);
}

async function handleRandomGraph() {
  const article = await getRandomArticle();
  if (article) {
    selectedSource.value = article;
    exploration.reset();
    await buildGraphAPI(article.title, 2, 100);
  }
}

async function handleStartInteractive() {
  if (!selectedSource.value) return;

  clearGraph();
  clearPath();
  timer.reset();
  exploration.startExploration(selectedSource.value);

  nextTick(() => {
    graphCanvasRef.value?.centerView();
  });
}

async function handleNodeClick(event, node) {
  // Non-interactive mode: open Wikipedia
  if (!exploration.isInteractiveMode.value) {
    const url = getWikipediaUrl(node.title);
    window.open(url, "_blank");
    return;
  }

  // Start timer on first click in interactive mode
  if (!timer.isRunning.value) {
    timer.start();
  }

  try {
    await exploration.handleNodeClick(node, getNeighborsAPI, selectedTarget.value);

    // Check if target reached
    if (exploration.targetFound.value) {
      timer.stop();
      showSuccessNotification();
    }
  } catch (err) {
    error.value = err.message || "Failed to get neighbors";
    console.error("Error handling node click:", err);
  }
}

async function handleJumpToNode(node, index) {
  if (!exploration.isInteractiveMode.value) return;

  try {
    await exploration.jumpToNode(node, index, getNeighborsAPI, selectedTarget.value);
  } catch (err) {
    error.value = err.message || "Failed to jump to node";
    console.error("Error jumping to node:", err);
  }
}

function handleClear() {
  clearGraph();
  clearPath();
  exploration.reset();
  timer.reset();
  selectedSource.value = null;
  selectedTarget.value = null;

  // Reinitialize canvas
  nextTick(() => {
    graphCanvasRef.value?.reinitialize();
  });
}

function handleCenterView() {
  graphCanvasRef.value?.centerView();
}

function showSuccessNotification() {
  notification.value = {
    show: true,
    type: "success",
    title: "Congratulations!",
    message: "You reached the target article!",
    stats: {
      clicks: Math.max(0, exploration.explorationPath.value.length - 1),
      time: formatMsToMinutesSeconds(timer.elapsedMs.value),
    },
    showPlayAgain: true,
  };
}

function closeNotification() {
  notification.value.show = false;
  exploration.targetFound.value = false;
  timer.reset();
}

function playAgain() {
  notification.value.show = false;
  handleClear();
  timer.reset();
}

// Cleanup on unmount
onBeforeUnmount(() => {
  timer.cleanup();
});
</script>

<style scoped>
.graph-visualization {
  position: relative;
  height: 100%;
  width: 100%;
  background: #fafafa;
}
</style>
