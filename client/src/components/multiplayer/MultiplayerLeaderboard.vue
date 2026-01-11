<template>
  <div class="leaderboard-overlay">
    <div class="leaderboard-container">
      <div class="leaderboard-header">
        <h2 class="title">Game Over!</h2>
        <p class="subtitle">Final Rankings</p>
      </div>

      <div class="leaderboard-list">
        <div 
          v-for="(player, index) in leaderboard" 
          :key="player.id"
          class="leaderboard-item"
          :class="{ 
            'rank-1': index === 0,
            'rank-2': index === 1,
            'rank-3': index === 2,
            'is-current': player.id === currentPlayerId
          }"
        >
          <div class="rank">
            <span v-if="index === 0" class="medal">1st</span>
            <span v-else-if="index === 1" class="medal">2nd</span>
            <span v-else-if="index === 2" class="medal">3rd</span>
            <span v-else class="rank-number">#{{ index + 1 }}</span>
          </div>

          <div class="player-details">
            <div class="player-name-row">
              <span class="player-name">{{ player.name }}</span>
              <span v-if="player.id === currentPlayerId" class="you-badge">YOU</span>
            </div>
            <div class="player-stats-row">
              <span class="stat">
                <span class="stat-icon">Clicks:</span>
                {{ player.clicks }} clicks
              </span>
              <span class="stat" :class="{ reached: player.reached }">
                <span class="stat-icon">{{ player.reached ? '✓' : '✗' }}</span>
                {{ player.reached ? 'Reached' : 'Not reached' }}
              </span>
            </div>
          </div>

          <div class="score">
            <span class="score-value">{{ player.score || 0 }}</span>
            <span class="score-label">pts</span>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="play-again-button" @click="handlePlayAgain">
          Play Again
        </button>
        <button class="leave-button" @click="handleLeave">
          ← Leave Room
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  leaderboard: {
    type: Array,
    required: true
  },
  currentPlayerId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['play-again', 'leave'])

const handlePlayAgain = () => {
  emit('play-again')
}

const handleLeave = () => {
  emit('leave')
}
</script>

<style scoped>
.leaderboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem 1rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.leaderboard-container {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: var(--color-white);
  border: 3px solid #2ec4b6;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.leaderboard-header {
  padding: 2rem;
  text-align: center;
  border-bottom: 3px solid var(--color-teal);
}

.title {
  font-family: 'Bagel Fat One', cursive;
  font-size: 2.5rem;
  color: #2ec4b6;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-family: 'Chewy', cursive;
  font-weight: 400;
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.leaderboard-list {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--color-white);
  border: 2px solid var(--color-teal);
  padding: 1rem;
  transition: all 0.2s ease;
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.leaderboard-item:nth-child(1) { animation-delay: 0.1s; }
.leaderboard-item:nth-child(2) { animation-delay: 0.15s; }
.leaderboard-item:nth-child(3) { animation-delay: 0.2s; }
.leaderboard-item:nth-child(4) { animation-delay: 0.25s; }
.leaderboard-item:nth-child(5) { animation-delay: 0.3s; }

.leaderboard-item.rank-1 {
  border-color: var(--color-secondary);
  background: var(--color-secondary);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.15);
}

.leaderboard-item.rank-2 {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.leaderboard-item.rank-3 {
  border-color: #fb923c;
  background: #fed7aa;
}

.leaderboard-item.is-current {
  border-color: var(--color-primary);
  border-width: 3px;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
}

.rank {
  font-family: 'Chewy', cursive;
  font-size: 1.5rem;
  font-weight: 400;
  min-width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.medal {
  font-family: 'Chewy', cursive;
  font-size: 1.5rem;
  color: #ff9f1c;
}

.rank-number {
  color: #64748b;
}

.player-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-name {
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.you-badge {
  background: #ff9f1c;
  color: var(--color-white);
  font-family: 'Chewy', cursive;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
}

.player-stats-row {
  display: flex;
  gap: 1rem;
}

.stat {
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat.reached {
  color: #10b981;
  font-weight: 600;
}

.stat-icon {
  font-family: 'DynaPuff', cursive;
  font-size: 0.875rem;
}

.score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 4rem;
}

.score-value {
  font-family: 'Chewy', cursive;
  font-size: 1.5rem;
  font-weight: 400;
  color: #2ec4b6;
}

.score-label {
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
}

.action-buttons {
  padding: 1.5rem;
  border-top: 3px solid var(--color-teal);
  display: flex;
  gap: 0.75rem;
}

.play-again-button {
  flex: 1;
  background: #10b981;
  color: var(--color-white);
  border: 3px solid #10b981;
  padding: 1rem 2rem;
  font-family: 'Chewy', cursive;
  font-size: 1.125rem;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
}

.play-again-button:hover {
  text-decoration: underline;
}

.play-again-button:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.leave-button {
  flex: 1;
  background: var(--color-white);
  color: #ef4444;
  border: 3px solid #fecaca;
  padding: 1rem 2rem;
  font-family: 'Chewy', cursive;
  font-size: 1.125rem;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.leave-button:hover {
  text-decoration: underline;
}

.leave-button:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

/* Scrollbar styling */
.leaderboard-list::-webkit-scrollbar {
  width: 6px;
}

.leaderboard-list::-webkit-scrollbar-track {
  background: var(--color-teal-light);
}

.leaderboard-list::-webkit-scrollbar-thumb {
  background: var(--color-teal);
}

.leaderboard-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}

@media (max-width: 640px) {
  .title {
    font-size: 2rem;
  }

  .leaderboard-item {
    padding: 0.875rem;
  }

  .player-name {
    font-size: 0.875rem;
  }

  .score-value {
    font-size: 1.25rem;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
