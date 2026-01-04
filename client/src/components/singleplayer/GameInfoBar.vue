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

        <button class="button is-danger is-small" @click="$emit('end-game')">
          End Game
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
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

defineEmits([
  "go-back",
  "go-forward",
  "end-game",
  "update:searchQuery",
  "clear-search",
  "previous-match",
  "next-match",
]);
</script>

<style scoped>
/* Game Info Bar - Fixed at top */
.game-info-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #f5f7ff 100%);
  border-bottom: 1px solid rgba(203, 213, 255, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  z-index: 30;
  padding: 0.75rem 0;
}

.game-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.75rem;
  flex-wrap: wrap;
  padding: 0 1rem;
}

/* Navigation Buttons */
.navigation-buttons {
  display: flex;
  gap: 0.75rem;
}

.nav-button {
  background: linear-gradient(135deg, #8a9bff 0%, #667eea 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  letter-spacing: 0.3px;
  padding: 0.4rem 1rem;
  box-shadow: 
    0 2px 6px rgba(102, 126, 234, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #9aaaff 0%, #7688ff 100%);
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.nav-button:hover::after {
  opacity: 1;
}

.nav-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 
    0 1px 3px rgba(102, 126, 234, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.nav-button:disabled {
  background: linear-gradient(135deg, #f0f2ff 0%, #e8ebff 100%);
  color: #a3a9d8;
  cursor: not-allowed;
  box-shadow: none;
}

/* Statistics Items */
.stat-item {
  font-size: 0.95rem;
  color: #5a5d7a;
  white-space: nowrap;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(203, 213, 255, 0.5);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.stat-item strong {
  color: #4a4b65;
  font-weight: 600;
  margin-right: 0.25rem;
}

.stat-item.timer {
  font-size: 1.3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
  border: none;
  background-color: transparent;
  padding: 0;
}

/* Search Container */
.search-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.search-input {
  width: 240px;
  border: 1px solid rgba(203, 213, 255, 0.8);
  border-radius: 10px;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.9);
  color: #4a4b65;
  padding: 0.6rem 1rem;
  padding-right: 2.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 2px 8px rgba(102, 126, 234, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 0.8);
}

.search-input::placeholder {
  color: #a3a9d8;
}

.search-input:focus {
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(255, 255, 255, 1);
  box-shadow: 
    0 4px 16px rgba(102, 126, 234, 0.15),
    0 0 0 4px rgba(102, 126, 234, 0.1),
    inset 0 1px 2px rgba(255, 255, 255, 0.8);
  outline: none;
}

.search-count {
  position: absolute;
  right: 4.5rem;
  font-size: 0.8rem;
  color: #667eea;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.search-nav-buttons {
  display: flex;
  gap: 0.5rem;
}

.search-nav-btn {
  background: linear-gradient(135deg, #8a9bff 0%, #667eea 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.35rem 0.6rem;
  font-weight: 600;
  min-width: 32px;
  height: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 2px 6px rgba(102, 126, 234, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.search-nav-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #9aaaff 0%, #7688ff 100%);
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.search-nav-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 
    0 1px 3px rgba(102, 126, 234, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.search-nav-btn:disabled {
  background: linear-gradient(135deg, #f0f2ff 0%, #e8ebff 100%);
  color: #a3a9d8;
  cursor: not-allowed;
  box-shadow: none;
}

/* End Game Button */
.button.is-danger.is-small {
  background: linear-gradient(135deg, #ff7b8e 0%, #ff6b6b 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  letter-spacing: 0.3px;
  padding: 0.5rem 1.25rem;
  box-shadow: 
    0 2px 6px rgba(255, 107, 107, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.button.is-danger.is-small:hover {
  background: linear-gradient(135deg, #ff8b9b 0%, #ff7b7b 100%);
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(255, 107, 107, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.button.is-danger.is-small:active {
  transform: translateY(0);
  box-shadow: 
    0 1px 3px rgba(255, 107, 107, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .game-stats {
    gap: 1rem;
  }
  
  .search-input {
    width: 180px;
  }
}

@media (max-width: 768px) {
  .game-stats {
    justify-content: center;
    gap: 0.75rem;
    padding: 0.5rem;
  }
  
  .stat-item {
    font-size: 0.85rem;
    padding: 0.4rem 0.6rem;
  }
  
  .search-input {
    width: 150px;
    padding: 0.5rem 0.75rem;
  }
  
  .search-count {
    right: 4rem;
  }
}
</style>