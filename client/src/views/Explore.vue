<template>
  <div class="explore">
    <div class="visualization-container">
      <WikiGraphVisualization />
    </div>
  </div>
</template>

<script setup>
import WikiGraphVisualization from "@/components/WikiGraphVisualization.vue";
</script>

<style scoped>
.explore {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #fafafa;
}

.visualization-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}
</style>
