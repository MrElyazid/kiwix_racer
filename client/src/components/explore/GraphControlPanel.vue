<template>
  <div class="control-panel" :class="{ collapsed: isPanelCollapsed }">
    <div class="panel-header" @click="isPanelCollapsed = !isPanelCollapsed">
      <h3 class="panel-title">Graph Controls</h3>
      <button class="toggle-btn">
        {{ isPanelCollapsed ? "▼" : "▲" }}
      </button>
    </div>

    <div v-if="!isPanelCollapsed" class="panel-content">
      <!-- Search Section -->
      <div class="control-section">
        <div class="search-box">
          <input
            :value="searchQuery"
            @input="handleSearchInput"
            type="text"
            placeholder="Search articles..."
            class="search-input"
          />
        </div>

        <div v-if="searchResults.length > 0" class="search-results">
          <div
            v-for="result in searchResults"
            :key="result.id"
            @click="handleSelectArticle(result)"
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
            <button @click="$emit('update:selectedSource', null)" class="btn-remove">
              ×
            </button>
          </div>
          <div v-if="selectedTarget" class="selected-item target">
            <span class="label">To:</span>
            <span class="value">{{ selectedTarget.title }}</span>
            <button @click="$emit('update:selectedTarget', null)" class="btn-remove">
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="control-section">
        <div class="action-grid">
          <button
            @click="$emit('find-path')"
            :disabled="!canFindPath || isLoading"
            class="btn-action btn-primary"
            title="Find shortest path between selected articles"
          >
            {{ isLoading ? "Finding..." : "Find Path" }}
          </button>
          <button
            @click="$emit('start-interactive')"
            :disabled="!selectedSource || isLoading"
            class="btn-action btn-secondary"
            :class="{ 'btn-active': isInteractiveMode }"
            title="Interactive exploration mode"
          >
            {{ isInteractiveMode ? "Exploring..." : "GameTree" }}
          </button>
          <button
            @click="$emit('build-graph')"
            :disabled="!selectedSource || isLoading"
            class="btn-action btn-secondary"
            title="Build graph from selected article"
          >
            {{ isLoading ? "Building..." : "Build Graph" }}
          </button>
          <button
            @click="$emit('random-graph')"
            :disabled="isLoading"
            class="btn-action btn-secondary"
            title="Get random article and build its graph"
          >
            Random
          </button>
          <button
            @click="$emit('center-view')"
            class="btn-action btn-secondary"
            title="Reset view to center"
          >
            Center View
          </button>
          <button @click="$emit('clear')" class="btn-action btn-clear">
            Clear
          </button>
        </div>
      </div>

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
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { convertSpacesToUnderscores } from "@/utils/graphHelpers";
import { useGraphVisualization } from "@/composables/useGraphVisualization";

const props = defineProps({
  selectedSource: {
    type: Object,
    default: null,
  },
  selectedTarget: {
    type: Object,
    default: null,
  },
  isInteractiveMode: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  pathInfo: {
    type: Object,
    default: null,
  },
  graphInfo: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "update:selectedSource",
  "update:selectedTarget",
  "find-path",
  "build-graph",
  "random-graph",
  "start-interactive",
  "center-view",
  "clear",
]);

const isPanelCollapsed = ref(false);
const searchQuery = ref("");

const { searchResults, searchArticles } = useGraphVisualization();

let searchTimeout = null;

const canFindPath = computed(
  () => props.selectedSource && props.selectedTarget
);

/**
 * Handle search input with space-to-underscore conversion
 */
const handleSearchInput = (e) => {
  const el = e.target;
  const old = el.value;
  const caretPos = el.selectionStart;

  const { newVal, newPos } = convertSpacesToUnderscores(old, caretPos);

  if (newVal !== old) {
    searchQuery.value = newVal;
    nextTick(() => {
      try {
        el.setSelectionRange(newPos, newPos);
      } catch (err) {
        // ignore
      }
    });
  } else {
    searchQuery.value = newVal;
  }

  debouncedSearch();
};

/**
 * Debounced search function
 */
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    await searchArticles(searchQuery.value);
  }, 300);
};

/**
 * Handle article selection
 */
const handleSelectArticle = (article) => {
  if (!props.selectedSource) {
    emit("update:selectedSource", article);
  } else if (!props.selectedTarget) {
    emit("update:selectedTarget", article);
  } else {
    emit("update:selectedSource", article);
    emit("update:selectedTarget", null);
  }
  searchQuery.value = "";
  searchResults.value = [];
};
</script>

<style scoped>
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
