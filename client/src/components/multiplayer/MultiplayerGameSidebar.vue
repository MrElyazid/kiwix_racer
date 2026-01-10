<template>
  <div class="game-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">
        <span class="gradient-text">Players</span>
      </h3>
    </div>

    <div class="players-list">
      <div 
        v-for="player in sortedPlayers" 
        :key="player.id"
        class="player-item"
        :class="{ 
          'is-current': player.id === currentPlayerId,
          'has-reached': player.reached 
        }"
      >
        <div class="player-info">
          <div class="player-header">
            <span class="player-name">{{ player.name }}</span>
            <span v-if="player.reached" class="checkmark">DONE</span>
          </div>
          <div class="player-stats">
            <span class="article-name" :title="player.currentArticle">
              {{ truncateArticle(player.currentArticle) }}
            </span>
            <span class="clicks-count">{{ player.clicks }} clicks</span>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="target-info">
        <span class="target-label">Target:</span>
        <span class="target-article" :title="targetArticle">
          {{ truncateArticle(targetArticle) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  players: {
    type: Array,
    required: true
  },
  currentPlayerId: {
    type: String,
    required: true
  },
  targetArticle: {
    type: String,
    required: true
  }
})

const sortedPlayers = computed(() => {
  // Sort by: reached first, then by clicks (ascending)
  return [...props.players].sort((a, b) => {
    if (a.reached && !b.reached) return -1
    if (!a.reached && b.reached) return 1
    return a.clicks - b.clicks
  })
})

const truncateArticle = (article) => {
  if (!article) return 'Starting...'
  if (article.length <= 30) return article
  return article.substring(0, 30) + '...'
}
</script>

<style scoped>
.game-sidebar {
  width: 300px;
  height: 100vh;
  background: #fffbf0;
  border-left: 3px solid #f0e6d2;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.06);
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 2px solid #f0e6d2;
  background: #fff9e6;
}

.sidebar-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.players-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #fffbf0;
}

.player-item {
  background: white;
  border: 2px solid #e8dcc0;
  border-radius: 8px;
  padding: 0.875rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(139, 117, 74, 0.08);
}

.player-item.is-current {
  border-color: #ff9f1c;
  background: #fff8e6;
  box-shadow: 0 4px 12px rgba(255, 159, 28, 0.15);
}

.player-item.has-reached {
  border-color: #90be6d;
  background: #f1f8e9;
  box-shadow: 0 4px 12px rgba(144, 190, 109, 0.15);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.player-name {
  font-weight: 700;
  color: #3e2723;
  font-size: 0.875rem;
}

.checkmark {
  color: #90be6d;
  font-size: 0.75rem;
  font-weight: 700;
}

.player-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.article-name {
  color: #6d5d39;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clicks-count {
  color: #8b7355;
  font-size: 0.75rem;
  font-weight: 600;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 2px solid #f0e6d2;
  background: #fff9e6;
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.target-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.target-article {
  font-weight: 700;
  color: #667eea;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Scrollbar styling */
.players-list::-webkit-scrollbar {
  width: 6px;
}

.players-list::-webkit-scrollbar-track {
  background: #f0e6d2;
  border-radius: 3px;
}

.players-list::-webkit-scrollbar-thumb {
  background: #d4c5a9;
  border-radius: 3px;
}

.players-list::-webkit-scrollbar-thumb:hover {
  background: #c4b299;
}

@media (max-width: 768px) {
  .game-sidebar {
    width: 100%;
    height: auto;
    max-height: 40vh;
    border-left: none;
    border-top: 1px solid rgba(226, 232, 240, 0.8);
  }
}
</style>
