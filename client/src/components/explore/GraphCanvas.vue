<template>
  <div ref="graphContainer" class="graph-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useD3Graph } from "@/composables/useD3Graph";

const props = defineProps({
  nodes: {
    type: Array,
    default: () => [],
  },
  links: {
    type: Array,
    default: () => [],
  },
  path: {
    type: Array,
    default: () => [],
  },
  isInteractiveMode: {
    type: Boolean,
    default: false,
  },
  selectedSource: {
    type: Object,
    default: null,
  },
  selectedTarget: {
    type: Object,
    default: null,
  },
  targetFound: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["node-click"]);

const graphContainer = ref(null);
const d3Graph = useD3Graph();

// Initialize visualization on mount
onMounted(() => {
  if (graphContainer.value) {
    const width = graphContainer.value.clientWidth;
    const height = graphContainer.value.clientHeight;
    d3Graph.initVisualization(graphContainer.value, width, height);
  }
});

// Watch for data changes and update visualization
watch(
  [() => props.nodes, () => props.links, () => props.path],
  () => {
    if (props.nodes.length === 0) return;

    try {
      nextTick(() => {
        d3Graph.updateVisualization(props.nodes, props.links, props.path, {
          isInteractiveMode: props.isInteractiveMode,
          selectedSource: props.selectedSource,
          selectedTarget: props.selectedTarget,
          targetFound: props.targetFound,
          onNodeClick: handleNodeClick,
        });
      });
    } catch (err) {
      console.error("Error updating visualization:", err);
    }
  },
  { deep: true }
);

/**
 * Handle node click events
 */
function handleNodeClick(event, d) {
  event.stopPropagation();
  event.preventDefault();
  emit("node-click", event, d);
}

/**
 * Center view programmatically
 * Exposed to parent via defineExpose
 */
function centerView() {
  d3Graph.centerView();
}

/**
 * Reinitialize visualization
 * Exposed to parent for manual reset
 */
function reinitialize() {
  if (graphContainer.value) {
    const width = graphContainer.value.clientWidth;
    const height = graphContainer.value.clientHeight;
    d3Graph.initVisualization(graphContainer.value, width, height);
  }
}

// Cleanup on unmount
onBeforeUnmount(() => {
  d3Graph.cleanup();
});

// Expose methods to parent
defineExpose({
  centerView,
  reinitialize,
});
</script>

<style scoped>
.graph-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
}

/* D3 element styles */
:deep(.link) {
  pointer-events: none;
}

:deep(.node) {
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.node:hover) {
  filter: brightness(1.2);
  stroke-width: 3px;
}

:deep(.label) {
  pointer-events: all;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  font-size: 6px;
  transition: all 0.2s;
}

:deep(.label:hover) {
  font-weight: 700;
  fill: #1a1a1a;
}
</style>
