<template>
  <div v-if="show" class="exploration-timeline">
    <div class="timeline-header">
      <span class="timeline-title">Path History</span>
    </div>
    <div class="timeline-items">
      <div
        v-for="(node, index) in explorationPath"
        :key="index"
        @click="$emit('jump-to-node', node, index)"
        class="timeline-item"
        :class="{
          'is-root': index === 0,
          'is-current': index === explorationPath.length - 1,
          'is-target': selectedTarget && node.title === selectedTarget.title,
        }"
      >
        <div class="timeline-number">{{ index }}</div>
        <div class="timeline-content">
          <div class="timeline-node-title">{{ node.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  explorationPath: {
    type: Array,
    default: () => [],
  },
  selectedTarget: {
    type: Object,
    default: null,
  },
  isInteractiveMode: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["jump-to-node"]);

const show = computed(
  () => props.isInteractiveMode && props.explorationPath.length > 0
);
</script>

<style scoped>
.exploration-timeline {
  position: absolute;
  top: 1rem;
  right: 356px; /* Control panel width (320px) + gap (36px) */
  width: 280px;
  max-height: calc(100vh - 200px);
  background: rgba(255, 255, 255, 0.98);
  border: 2px solid #c2e2fa;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.timeline-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #c2e2fa 0%, #a8d5f7 100%);
  border-bottom: 2px solid #c2e2fa;
}

.timeline-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
}

.timeline-items {
  padding: 0.5rem;
  max-height: calc(100vh - 260px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  background: white;
  border: 2px solid #c2e2fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-item:hover {
  background: #f0f8ff;
  border-color: #a8d5f7;
  transform: translateX(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.timeline-item.is-root {
  border-color: #4caf50;
  background: #f1f8f4;
}

.timeline-item.is-current {
  border-color: #ff6b6b;
  background: #fff5f5;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
}

.timeline-item.is-target {
  border-color: #ffd700;
  background: #fffbf0;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
}

.timeline-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: #c2e2fa;
  color: #1a1a1a;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.timeline-item.is-root .timeline-number {
  background: #4caf50;
  color: white;
}

.timeline-item.is-current .timeline-number {
  background: #ff6b6b;
  color: white;
}

.timeline-item.is-target .timeline-number {
  background: #ffd700;
  color: #1a1a1a;
}

.timeline-content {
  flex: 1;
  overflow: hidden;
}

.timeline-node-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-item.is-current .timeline-node-title {
  font-weight: 700;
}

.timeline-items::-webkit-scrollbar {
  width: 6px;
}

.timeline-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.timeline-items::-webkit-scrollbar-thumb {
  background: #c2e2fa;
  border-radius: 3px;
}

.timeline-items::-webkit-scrollbar-thumb:hover {
  background: #a8d5f7;
}
</style>
