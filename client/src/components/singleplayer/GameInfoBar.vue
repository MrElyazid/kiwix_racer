<template>
  <div class="game-info-bar">
    <div class="container is-fluid">
      <div class="game-stats">
        <!-- Navigation Buttons -->
        <div class="navigation-buttons">
          <button
            class="button is-small nav-button"
            @click="$emit('go-back')"
            :disabled="!canGoBack"
            title="Go back"
          >
            ← Back
          </button>
          <button
            class="button is-small nav-button"
            @click="$emit('go-forward')"
            :disabled="!canGoForward"
            title="Go forward"
          >
            Forward →
          </button>
        </div>

        <span class="stat-item">
          <strong>Start:</strong> {{ startArticle }}
        </span>
        <span class="stat-item timer">
          <strong>⏱</strong> {{ formattedTime }}
        </span>
        <span class="stat-item">
          <strong>Clicks:</strong> {{ clickCount }}
        </span>
        <span class="stat-item">
          <strong>Target:</strong> {{ targetArticle }}
        </span>

        <!-- Search Box -->
        <div class="search-container">
          <input
            :value="searchQuery"
            type="text"
            class="input is-small search-input"
            placeholder="Search in page (Ctrl+F)"
            @input="$emit('update:searchQuery', $event.target.value)"
            @keydown.escape="$emit('clear-search')"
          />
          <span v-if="searchQuery && searchMatches > 0" class="search-count">
            {{ currentSearchMatch }}/{{ searchMatches }}
          </span>
          <div v-if="searchQuery" class="search-nav-buttons">
            <button
              class="button is-small search-nav-btn"
              @click="$emit('previous-match')"
              :disabled="searchMatches === 0"
              title="Previous match (Shift+Enter)"
            >
              ↑
            </button>
            <button
              class="button is-small search-nav-btn"
              @click="$emit('next-match')"
              :disabled="searchMatches === 0"
              title="Next match (Enter)"
            >
              ↓
            </button>
            <button
              class="button is-small search-nav-btn"
              @click="$emit('clear-search')"
              title="Clear search (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        <button class="button is-danger is-small" @click="showConfirmation = true">
          End Game
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmation" class="modal is-active">
      <div class="modal-background" @click="showConfirmation = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">End Game?</p>
        </header>
        <section class="modal-card-body">
          <p>Are you sure you want to end the game? All progress will be lost.</p>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-danger" @click="confirmEndGame">
            Yes, End Game
          </button>
          <button class="button" @click="showConfirmation = false">
            Cancel
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  startArticle: String,
  targetArticle: String,
  clickCount: Number,
  formattedTime: String,
  canGoBack: Boolean,
  canGoForward: Boolean,
  searchQuery: String,
  searchMatches: Number,
  currentSearchMatch: Number,
});

const emit = defineEmits([
  "go-back",
  "go-forward",
  "end-game",
  "update:searchQuery",
  "clear-search",
  "previous-match",
  "next-match",
]);

const showConfirmation = ref(false);

function confirmEndGame() {
  showConfirmation.value = false;
  emit("end-game");
}
</script>

<style scoped>
/* Game Info Bar - Fixed at top */
.game-info-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 2px solid #c2e2fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 30;
  padding: 0.75rem 0;
}

.game-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding: 0 1rem;
}

.navigation-buttons {
  display: flex;
  gap: 0.5rem;
}

.nav-button {
  background: #667eea;
  color: white;
  border: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav-button:hover:not(:disabled) {
  background: #764ba2;
  color: white;
}

.nav-button:disabled {
  background: #e8e8e8;
  color: #999;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Search Container */
.search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.search-input {
  width: 200px;
  border-color: #667eea;
  font-size: 0.875rem;
  background-color: white;
  color: #1a1a1a;
}

.search-input::placeholder {
  color: #999;
}

.search-input:focus {
  border-color: #764ba2;
  box-shadow: 0 0 0 0.125em rgba(102, 126, 234, 0.25);
}

.search-count {
  font-size: 0.75rem;
  color: #667eea;
  font-weight: 600;
  white-space: nowrap;
}

.search-nav-buttons {
  display: flex;
  gap: 0.25rem;
}

.search-nav-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  font-weight: 600;
  min-width: 28px;
}

.search-nav-btn:hover:not(:disabled) {
  background: #764ba2;
  color: white;
}

.search-nav-btn:disabled {
  background: #e8e8e8;
  color: #999;
  cursor: not-allowed;
}

.stat-item {
  font-size: 0.95rem;
  color: #1a1a1a;
  white-space: nowrap;
}

.stat-item strong {
  color: #000;
  font-weight: 700;
}

.stat-item.timer {
  font-size: 1.25rem;
  color: #3273dc;
  font-weight: 600;
}

/* Confirmation Modal */
.modal-background {
  background-color: rgba(10, 10, 10, 0.7);
}

.modal-card {
  border-radius: 12px;
  overflow: hidden;
}

.modal-card-head {
  background: linear-gradient(135deg, #c2e2fa 0%, #a8d5f7 100%);
  border-bottom: 2px solid #c2e2fa;
  padding: 1.25rem;
}

.modal-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
}

.modal-card-body {
  padding: 2rem 1.5rem;
  background: white;
  font-size: 1rem;
  color: #333;
}

.modal-card-foot {
  background: white;
  border-top: 1px solid #e8e8e8;
  padding: 1rem 1.5rem;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-card-foot .button {
  font-weight: 600;
}
</style>