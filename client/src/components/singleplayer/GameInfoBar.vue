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
          <strong>Time:</strong> {{ formattedTime }}
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
              Clear
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
  background: var(--color-white);
  border-bottom: 3px solid var(--color-teal);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
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
  background: var(--color-teal);
  color: var(--color-white);
  border: 2px solid var(--color-teal);
  font-family: 'Chewy', cursive;
  font-weight: 400;
  font-size: 0.875rem;
  transition: all 0.15s ease;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.nav-button:hover:not(:disabled) {
  text-decoration: underline;
  color: var(--color-white);
}

.nav-button:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
}

.nav-button:disabled {
  background: #e8e8e8;
  border-color: #ccc;
  color: #999;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
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
  border: 2px solid #2ec4b6;
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-size: 0.875rem;
  font-weight: 400;
  background-color: var(--color-white);
  color: #1a1a1a;
}

.search-input::placeholder {
  color: #999;
}

.search-input:focus {
  border-color: #ff9f1c;
  box-shadow: none;
}

.search-count {
  font-family: 'DynaPuff', cursive;
  font-size: 0.75rem;
  color: var(--color-teal);
  font-weight: 600;
  white-space: nowrap;
}

.search-nav-buttons {
  display: flex;
  gap: 0.25rem;
}

.search-nav-btn {
  background: var(--color-teal);
  color: var(--color-white);
  border: 2px solid var(--color-teal);
  padding: 0.25rem 0.5rem;
  font-family: 'Chewy', cursive;
  font-weight: 400;
  min-width: 28px;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
}

.search-nav-btn:hover:not(:disabled) {
  text-decoration: underline;
  color: var(--color-white);
}

.search-nav-btn:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.15);
}

.search-nav-btn:disabled {
  background: #e8e8e8;
  border-color: #ccc;
  color: #999;
  cursor: not-allowed;
  box-shadow: none;
}

.stat-item {
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 400;
  color: #1a1a1a;
  white-space: nowrap;
}

.stat-item strong {
  color: #000;
  font-weight: 700;
}

.stat-item.timer {
  font-size: 1.25rem;
  color: #2ec4b6;
  font-weight: 600;
}

/* Confirmation Modal */
.modal-background {
  background-color: rgba(10, 10, 10, 0.7);
}

.modal-card {
  overflow: hidden;
  border: 3px solid var(--color-primary);
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
}

.modal-card-head {
  background: var(--color-secondary);
  border-bottom: 3px solid var(--color-primary);
  padding: 1.25rem;
}

.modal-card-title {
  font-family: 'Bagel Fat One', cursive;
  font-size: 1.5rem;
  color: #1a1a1a;
}

.modal-card-body {
  padding: 2rem 1.5rem;
  background: var(--color-white);
  font-family: 'DynaPuff', cursive;
  font-size: 1rem;
  font-weight: 400;
  color: #333;
}

.modal-card-foot {
  background: var(--color-white);
  border-top: 2px solid var(--color-teal);
  padding: 1rem 1.5rem;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-card-foot .button {
  font-family: 'Chewy', cursive;
  font-weight: 400;
  font-size: 1rem;
}
</style>