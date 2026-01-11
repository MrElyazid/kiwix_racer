<template>
  <div class="game-container">
    <div class="article-viewer">
      <div class="article-header">
        <h2 class="title is-5">{{ currentArticleTitle }}</h2>
      </div>

      <!-- Loading Spinner -->
      <div v-if="loadingArticle" class="loading-overlay">
        <div class="spinner"></div>
        <p class="loading-text">Loading article...</p>
      </div>

      <div
        ref="articleContentRef"
        v-show="!loadingArticle"
        class="article-content"
        v-html="currentArticleContent"
        @click="$emit('article-click', $event)"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  currentArticleTitle: String,
  currentArticleContent: String,
  loadingArticle: Boolean,
});

defineEmits(["article-click"]);

const articleContentRef = ref(null);

// Expose the ref so parent can access the DOM element
defineExpose({
  articleContentRef,
});
</script>

<style scoped>
/* Game Container - Full viewport */
.game-container {
  position: relative;
  height: 100%;
  background: white;
  z-index: 1;
}

.article-viewer {
  height: 100%;
  width: 100%;
  background: white;
  display: flex;
  flex-direction: column;
}

.article-header {
  padding: 1rem 1.5rem;
  border-bottom: 2px solid #f5f5f5;
  background: white;
  flex-shrink: 0;
}

.article-header .title {
  color: #1a1a1a;
  margin-bottom: 0;
}

.article-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  color: #202122;
  background: white;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3),
.article-content :deep(h4),
.article-content :deep(h5),
.article-content :deep(h6) {
  color: #000;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
  border-bottom: 1px solid #a2a9b1;
  padding-bottom: 0.25rem;
}

.article-content :deep(h1) {
  font-size: 2em;
}

.article-content :deep(h2) {
  font-size: 1.5em;
}

.article-content :deep(p) {
  color: #202122;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.article-content :deep(b),
.article-content :deep(strong) {
  color: #000;
  font-weight: 700;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  pointer-events: none;
  cursor: default;
}

/* Prevent clicking on links that contain images */
.article-content :deep(a:has(img)) {
  pointer-events: none;
  cursor: default;
}

.article-content :deep(a) {
  color: #0645ad;
  text-decoration: none;
}

.article-content :deep(a:hover) {
  text-decoration: underline;
}

/* Table styles */
.article-content :deep(table) {
  border-collapse: collapse;
  margin: 1rem 0;
  background: #f8f9fa;
  border: 1px solid #a2a9b1;
}

.article-content :deep(th) {
  background-color: #eaecf0;
  color: #202122;
  font-weight: 700;
  padding: 0.5rem;
  text-align: left;
  border: 1px solid #a2a9b1;
}

.article-content :deep(td) {
  padding: 0.5rem;
  border: 1px solid #a2a9b1;
  color: #202122;
  background: #fff;
}

.article-content :deep(tr:hover) {
  background-color: #eaecf0;
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e8f4ff;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 1rem;
  color: #667eea;
  font-size: 1.1rem;
  font-weight: 600;
}

/* Search Highlights */
.article-content :deep(.search-highlight) {
  background-color: #ffeb3b;
  padding: 0 2px;
  border-radius: 2px;
}

.article-content :deep(.search-highlight.current-match) {
  background-color: #ff9800;
  font-weight: 600;
}
</style>