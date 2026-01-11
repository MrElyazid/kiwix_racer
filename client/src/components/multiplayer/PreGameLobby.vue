<template>
  <div class="pregame-lobby">
    <P5Background />
    <div class="lobby-container">
      <!-- Room Code Display Section -->
      <div class="room-code-section">
        <h2 class="room-code-title">Room Code</h2>
        <div class="room-code-display">
          <span class="code-text">{{ roomCode }}</span>
        </div>
        <button 
          class="copy-button"
          :class="{ 'copied': showCopiedFeedback }"
          @click="copyRoomCode"
          :disabled="showCopiedFeedback"
        >
          <span v-if="!showCopiedFeedback">Copy Code</span>
          <span v-else>Copied!</span>
        </button>
        <p class="share-hint">Share this code with friends to join</p>
      </div>

      <!-- Players Section -->
      <div class="players-section">
        <h3 class="section-title">
          <span class="gradient-text">Players</span>
          <span class="player-count">{{ players.length }}/{{ maxPlayers }}</span>
        </h3>
        
        <!-- Current Player Name Editor -->
        <div class="current-player-section">
          <label class="name-edit-label">Your Name</label>
          <div class="name-edit-container">
            <input
              v-model="editingName"
              type="text"
              placeholder="Enter your name"
              class="name-edit-input"
              maxlength="20"
              @input="handleNameInput"
              @keyup.enter="saveName"
            />
            <button 
              class="save-name-button"
              @click="saveName"
              :disabled="!canSaveName || savingName"
            >
              {{ savingName ? 'Saving...' : 'Save' }}
            </button>
          </div>
          <p v-if="nameError" class="name-error">{{ nameError }}</p>
        </div>

        <div class="players-grid">
          <div 
            v-for="player in players" 
            :key="player.id"
            class="player-card"
            :class="{ 
              'is-host': player.id === hostId,
              'is-current': player.id === currentPlayerId
            }"
          >
            <span class="player-name">{{ player.name }}</span>
            <div class="player-badges">
              <span v-if="player.id === hostId" class="host-badge">Host</span>
              <span v-if="player.id === currentPlayerId" class="you-badge">YOU</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Language Selector (Host Only) -->
      <div v-if="isHost" class="language-section">
        <h3 class="section-title">
          <span class="gradient-text">Wikipedia Language</span>
        </h3>
        <div class="language-selector">
          <button
            class="language-button"
            :class="{ active: settings.language === 'en' }"
            @click="updateSetting('language', 'en')"
          >
            🇬🇧 English
          </button>
          <button
            class="language-button"
            :class="{ active: settings.language === 'fr' }"
            @click="updateSetting('language', 'fr')"
          >
            🇫🇷 Français
          </button>
        </div>
      </div>

      <!-- Article Selection Section (Host Only) -->
      <div v-if="isHost" class="article-section">
        <h3 class="section-title">
          <span class="gradient-text">Article Selection</span>
        </h3>
        <div class="article-grid">
          <div class="article-item">
            <label class="article-label">Starting Article</label>
            <div class="article-input-group">
              <input
                v-model="startArticle"
                type="text"
                placeholder="Enter article name or click Random"
                class="article-input"
                @input="searchStartArticles"
              />
              <button
                class="random-button"
                @click="getRandomStart"
                :disabled="loadingStart"
              >
                {{ loadingStart ? '...' : 'Random' }}
              </button>
            </div>
            <div v-if="startSuggestions.length > 0" class="suggestions-box">
              <div
                v-for="suggestion in startSuggestions"
                :key="suggestion.path"
                class="suggestion-item"
                @click="selectStartArticle(suggestion)"
              >
                {{ suggestion.title }}
              </div>
            </div>
          </div>

          <div class="article-item">
            <label class="article-label">Target Article</label>
            <div class="article-input-group">
              <input
                v-model="targetArticle"
                type="text"
                placeholder="Enter article name or click Random"
                class="article-input"
                @input="searchTargetArticles"
              />
              <button
                class="random-button"
                @click="getRandomTarget"
                :disabled="loadingTarget"
              >
                {{ loadingTarget ? '...' : 'Random' }}
              </button>
            </div>
            <div v-if="targetSuggestions.length > 0" class="suggestions-box">
              <div
                v-for="suggestion in targetSuggestions"
                :key="suggestion.path"
                class="suggestion-item"
                @click="selectTargetArticle(suggestion)"
              >
                {{ suggestion.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Settings Section (Host Only) -->
      <div v-if="isHost" class="settings-section">
        <h3 class="section-title">
          <span class="gradient-text">Game Settings</span>
        </h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">Time Limit</label>
            <div class="button-group">
              <button
                v-for="time in timeLimits"
                :key="time"
                class="setting-button"
                :class="{ active: settings.timeLimit === time }"
                @click="updateSetting('timeLimit', time)"
              >
                {{ time }} min
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Start Game Button (Host Only) -->
      <button
        v-if="isHost"
        class="start-game-button"
        :disabled="players.length < 2 || !startArticle || !targetArticle"
        @click="startGame"
      >
        Start Game
      </button>
      <p v-if="isHost && players.length < 2" class="waiting-message">
        Waiting for at least 2 players to start...
      </p>
      <p v-if="isHost && players.length >= 2 && (!startArticle || !targetArticle)" class="waiting-message">
        Please select start and target articles...
      </p>

      <!-- Leave Room Button -->
      <button class="leave-button" @click="leaveRoom">
        Leave Room
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import P5Background from '@/components/P5Background.vue'

const props = defineProps({
  roomCode: {
    type: String,
    required: true
  },
  players: {
    type: Array,
    required: true
  },
  hostId: {
    type: String,
    required: true
  },
  currentPlayerId: {
    type: String,
    required: true
  },
  settings: {
    type: Object,
    required: true
  },
  maxPlayers: {
    type: Number,
    default: 25
  }
})

const emit = defineEmits(['update-settings', 'start-game', 'leave-room', 'change-name'])

const showCopiedFeedback = ref(false)
const timeLimits = [3, 5, 10, 15]
const editingName = ref('')
const savingName = ref(false)
const nameError = ref('')

// Article selection
const startArticle = ref('')
const targetArticle = ref('')
const startSuggestions = ref([])
const targetSuggestions = ref([])
const loadingStart = ref(false)
const loadingTarget = ref(false)
let searchTimeout = null

const isHost = computed(() => props.currentPlayerId === props.hostId)

const currentPlayer = computed(() => {
  return props.players.find(p => p.id === props.currentPlayerId)
})

const canSaveName = computed(() => {
  const trimmed = editingName.value.trim()
  if (!trimmed || trimmed.length < 2 || trimmed.length > 20) return false
  if (trimmed === currentPlayer.value?.name) return false
  return true
})

// Initialize editing name with current player name
watch(() => currentPlayer.value?.name, (newName) => {
  if (newName && !editingName.value) {
    editingName.value = newName
  }
}, { immediate: true })

const handleNameInput = (e) => {
  // Allow letters, numbers, spaces, hyphens, and underscores
  const value = e.target.value
  editingName.value = value.replace(/[^a-zA-Z0-9 _-]/g, '')
  nameError.value = ''
}

const saveName = async () => {
  const trimmed = editingName.value.trim()
  
  if (trimmed.length < 2) {
    nameError.value = 'Name must be at least 2 characters'
    return
  }
  
  if (trimmed.length > 20) {
    nameError.value = 'Name must be 20 characters or less'
    return
  }

  if (trimmed === currentPlayer.value?.name) {
    return
  }

  savingName.value = true
  nameError.value = ''
  
  try {
    await emit('change-name', trimmed)
  } catch (error) {
    nameError.value = error.message || 'Failed to change name'
  } finally {
    savingName.value = false
  }
}

const copyRoomCode = async () => {
  try {
    await navigator.clipboard.writeText(props.roomCode)
    showCopiedFeedback.value = true
    setTimeout(() => {
      showCopiedFeedback.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy room code:', err)
    // Fallback for older browsers
    fallbackCopyToClipboard(props.roomCode)
  }
}

const fallbackCopyToClipboard = (text) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
    showCopiedFeedback.value = true
    setTimeout(() => {
      showCopiedFeedback.value = false
    }, 2000)
  } catch (err) {
    console.error('Fallback copy failed:', err)
    alert('Failed to copy. Please copy manually: ' + text)
  }
  document.body.removeChild(textArea)
}

const updateSetting = (key, value) => {
  emit('update-settings', { [key]: value })
}

const startGame = () => {
  emit('start-game')
}

const leaveRoom = () => {
  emit('leave-room')
}

// Article search functions
async function searchStartArticles() {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (startArticle.value.length < 2) {
    startSuggestions.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      loadingStart.value = true
      const wikiLang = props.settings.language === 'fr' ? 'fr' : 'en'
      const response = await axios.get(`https://${wikiLang}.wikipedia.org/w/api.php`, {
        params: {
          action: 'opensearch',
          search: startArticle.value,
          limit: 5,
          namespace: 0,
          format: 'json',
          origin: '*'
        }
      })
      const titles = response.data[1] || []
      startSuggestions.value = titles.map((title) => ({
        title,
        path: title.replace(/ /g, '_')
      }))
    } catch (error) {
      console.error('Error searching articles:', error)
    } finally {
      loadingStart.value = false
    }
  }, 300)
}

async function searchTargetArticles() {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (targetArticle.value.length < 2) {
    targetSuggestions.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      loadingTarget.value = true
      const wikiLang = props.settings.language === 'fr' ? 'fr' : 'en'
      const response = await axios.get(`https://${wikiLang}.wikipedia.org/w/api.php`, {
        params: {
          action: 'opensearch',
          search: targetArticle.value,
          limit: 5,
          namespace: 0,
          format: 'json',
          origin: '*'
        }
      })
      const titles = response.data[1] || []
      targetSuggestions.value = titles.map((title) => ({
        title,
        path: title.replace(/ /g, '_')
      }))
    } catch (error) {
      console.error('Error searching articles:', error)
    } finally {
      loadingTarget.value = false
    }
  }, 300)
}

function selectStartArticle(suggestion) {
  startArticle.value = suggestion.title
  startSuggestions.value = []
  updateArticles()
}

function selectTargetArticle(suggestion) {
  targetArticle.value = suggestion.title
  targetSuggestions.value = []
  updateArticles()
}

async function getRandomStart() {
  try {
    loadingStart.value = true
    const language = props.settings.language || 'en'
    const baseUrl = 'http://localhost:3000'
    const response = await axios.get(`${baseUrl}/api/articles/random?language=${language}`)
    startArticle.value = response.data.title
    startSuggestions.value = []
    updateArticles()
  } catch (error) {
    console.error('Error getting random article:', error)
  } finally {
    loadingStart.value = false
  }
}

async function getRandomTarget() {
  try {
    loadingTarget.value = true
    const language = props.settings.language || 'en'
    const baseUrl = 'http://localhost:3000'
    const response = await axios.get(`${baseUrl}/api/articles/random?language=${language}`)
    targetArticle.value = response.data.title
    targetSuggestions.value = []
    updateArticles()
  } catch (error) {
    console.error('Error getting random article:', error)
  } finally {
    loadingTarget.value = false
  }
}

function updateArticles() {
  if (startArticle.value && targetArticle.value) {
    emit('update-settings', {
      startArticle: startArticle.value,
      targetArticle: targetArticle.value
    })
  }
}
</script>

<style scoped>
.pregame-lobby {
  min-height: 100vh;
  padding: 2rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lobby-container {
  width: 100%;
  max-width: 900px;
  background: var(--color-white);
  border: 3px solid var(--color-primary);
  padding: 2.5rem;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

/* Room Code Section */
.room-code-section {
  text-align: center;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 3px solid var(--color-teal);
}

/* Current Player Name Editor */
.current-player-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-teal-light);
  border: 2px solid var(--color-teal);
}

.name-edit-label {
  display: block;
  font-family: 'Chewy', cursive;
  font-weight: 400;
  color: #333;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.name-edit-container {
  display: flex;
  gap: 0.5rem;
}

.name-edit-input {
  flex: 1;
  padding: 0.75rem;
  border: 3px solid #2ec4b6;
  background: var(--color-white);
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
  transition: border-color 0.15s ease;
}

.name-edit-input:focus {
  outline: none;
  border-color: #ff9f1c;
}

.save-name-button {
  padding: 0.75rem 1.5rem;
  border: 3px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-white);
  font-family: 'Chewy', cursive;
  font-weight: 400;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);
}

.save-name-button:hover:not(:disabled) {
  text-decoration: underline;
}

.save-name-button:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.save-name-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.name-error {
  margin-top: 0.5rem;
  font-family: 'DynaPuff', cursive;
  font-size: 0.75rem;
  color: #dc2626;
  font-weight: 600;
}

.player-badges {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.you-badge {
  font-family: 'DynaPuff', cursive;
  font-size: 0.7rem;
  padding: 0.125rem 0.375rem;
  background: var(--color-primary);
  color: var(--color-white);
  font-weight: 600;
}

.player-card.is-current {
  border-color: var(--color-primary);
  background: var(--color-secondary);
}

.room-code-title {
  font-family: 'Bagel Fat One', cursive;
  font-size: 1.5rem;
  color: #2ec4b6;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.room-code-display {
  background: var(--color-teal-light);
  padding: 1.5rem 2rem;
  border: 3px solid var(--color-teal);
  margin-bottom: 1rem;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.code-text {
  font-size: 3rem;
  font-weight: 700;
  font-family: 'Google Sans Code', 'Courier New', monospace;
  letter-spacing: 0.25em;
  color: #2ec4b6;
  user-select: all;
}

.copy-button {
  background: var(--color-primary);
  color: var(--color-white);
  border: 3px solid var(--color-primary);
  padding: 0.875rem 2rem;
  font-family: 'Chewy', cursive;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
  margin-bottom: 0.75rem;
}

.copy-button:hover:not(:disabled) {
  text-decoration: underline;
}

.copy-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.copy-button.copied {
  background: #10b981;
  border-color: #10b981;
}

.copy-button:disabled {
  cursor: not-allowed;
  opacity: 0.9;
}

.share-hint {
  font-family: 'DynaPuff', cursive;
  font-weight: 400;
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

/* Players Section */
.players-section {
  margin-bottom: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Bagel Fat One', cursive;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.gradient-text {
  color: var(--color-primary);
}

.player-count {
  font-family: 'Chewy', cursive;
  color: #666;
  font-size: 1rem;
  font-weight: 400;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--color-teal-light);
  border: 2px solid var(--color-teal);
}

.player-card {
  background: var(--color-white);
  padding: 0.875rem;
  border: 2px solid var(--color-teal);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-card.is-host {
  border: 3px solid var(--color-secondary);
  background: var(--color-secondary);
}

.player-name {
  font-family: 'DynaPuff', cursive;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.host-badge {
  font-family: 'Chewy', cursive;
  font-size: 0.75rem;
  color: var(--color-primary);
  font-weight: 400;
}

/* Language Section */
.language-section {
  margin-bottom: 2rem;
}

.language-selector {
  display: flex;
  gap: 0.75rem;
  background: var(--color-teal-light);
  padding: 1.5rem;
  border: 2px solid var(--color-teal);
}

.language-button {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: 3px solid var(--color-teal);
  background: var(--color-white);
  color: #333;
  font-family: 'Chewy', cursive;
  font-weight: 400;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
}

.language-button:hover {
  text-decoration: underline;
}

.language-button:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.language-button.active {
  background: var(--color-teal);
  color: var(--color-white);
  border-color: var(--color-teal);
}

/* Article Selection Section */
.article-section {
  margin-bottom: 2rem;
}

.article-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--color-teal-light);
  padding: 1.5rem;
  border: 2px solid var(--color-teal);
}

.article-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.article-label {
  font-family: 'Chewy', cursive;
  font-weight: 400;
  color: #333;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.article-input-group {
  display: flex;
  gap: 0.5rem;
}

.article-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 3px solid #2ec4b6;
  background: var(--color-white);
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
  transition: border-color 0.15s ease;
}

.article-input:focus {
  outline: none;
  border-color: #ff9f1c;
}

.random-button {
  padding: 0.75rem 1rem;
  border: 3px solid var(--color-teal);
  background: var(--color-white);
  font-family: 'Chewy', cursive;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 100px;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
}

.random-button:hover:not(:disabled) {
  text-decoration: underline;
}

.random-button:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.random-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.suggestions-box {
  position: absolute;
  top: 100%;
  left: 0;
  right: 50px;
  background: var(--color-white);
  border: 3px solid var(--color-teal);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 0.25rem;
}

.suggestion-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  font-family: 'DynaPuff', cursive;
  font-size: 0.875rem;
  color: #1e293b;
}

.suggestion-item:hover {
  background-color: var(--color-teal-light);
}

.suggestion-item:not(:last-child) {
  border-bottom: 2px solid var(--color-teal-light);
}

/* Settings Section */
.settings-section {
  margin-bottom: 2rem;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--color-teal-light);
  padding: 1.5rem;
  border: 2px solid var(--color-teal);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-label {
  font-family: 'Chewy', cursive;
  font-weight: 400;
  color: #333;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.setting-button {
  flex: 1;
  min-width: 80px;
  padding: 0.75rem 1rem;
  border: 3px solid var(--color-teal);
  background: var(--color-white);
  color: #333;
  font-family: 'Chewy', cursive;
  font-weight: 400;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
}

.setting-button:hover {
  text-decoration: underline;
}

.setting-button:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.setting-button.active {
  background: var(--color-teal);
  color: var(--color-white);
  border-color: var(--color-teal);
}

.language-btn {
  font-size: 0.95rem;
}

/* Action Buttons */
.start-game-button {
  width: 100%;
  background: #10b981;
  color: var(--color-white);
  border: 3px solid #10b981;
  padding: 1rem 2rem;
  font-family: 'Chewy', cursive;
  font-size: 1.25rem;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
  margin-bottom: 1rem;
}

.start-game-button:hover:not(:disabled) {
  text-decoration: underline;
}

.start-game-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.start-game-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.waiting-message {
  font-family: 'DynaPuff', cursive;
  font-weight: 400;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
  font-style: italic;
}

.leave-button {
  width: 100%;
  background: var(--color-white);
  color: #ef4444;
  border: 3px solid #fecaca;
  padding: 0.875rem 2rem;
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

/* Responsive Design */
@media (max-width: 768px) {
  .code-text {
    font-size: 2rem;
    letter-spacing: 0.2em;
  }

  .lobby-container {
    padding: 1.5rem;
  }

  .players-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .button-group {
    flex-direction: column;
  }

  .setting-button {
    min-width: 100%;
  }
}

@media (max-width: 480px) {
  .code-text {
    font-size: 1.5rem;
  }
}
</style>