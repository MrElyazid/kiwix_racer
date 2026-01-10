<template>
  <div class="multiplayer-view">
    <!-- Background gradient -->
    <div class="background-gradient"></div>

    <!-- Lobby Entry Phase -->
    <LobbyEntry
      v-if="gameState === 'lobby-entry'"
      ref="lobbyEntryRef"
      @create-room="handleCreateRoom"
      @join-room="handleJoinRoom"
    />

    <!-- Pre-Game Lobby Phase -->
    <PreGameLobby
      v-else-if="gameState === 'waiting' && room"
      :room-code="roomCode"
      :players="players"
      :host-id="room.host"
      :current-player-id="playerId"
      :settings="settings"
      :max-players="25"
      @update-settings="handleUpdateSettings"
      @start-game="handleStartGame"
      @leave-room="handleLeaveRoom"
      @change-name="handleChangeName"
    />

    <!-- Active Game Phase -->
    <div v-else-if="gameState === 'playing'" class="game-layout">
      <!-- Game Info Bar (using singleplayer component) -->
      <GameInfoBar
        :start-article="settings.startArticle"
        :target-article="settings.targetArticle"
        :click-count="currentPlayer?.clicks || 0"
        :formatted-time="formattedTime"
        :can-go-back="canGoBack"
        :can-go-forward="canGoForward"
        :search-query="searchQuery"
        :search-matches="searchMatches"
        :current-search-match="currentSearchMatch"
        @go-back="goBack"
        @go-forward="goForward"
        @end-game="handleTimeUp"
        @update:search-query="handleSearchInput"
        @clear-search="clearSearch"
        @previous-match="previousMatch"
        @next-match="nextMatch"
      />

      <!-- Main Game Area -->
      <div class="game-main">
        <!-- Article Viewer (using singleplayer component) -->
        <div class="article-viewer-wrapper">
          <ArticleViewer
            ref="articleViewerRef"
            :current-article-title="currentArticleTitle"
            :current-article-content="currentArticleContent"
            :loading-article="loadingArticle"
            @article-click="handleArticleClick"
          />
        </div>

        <!-- Multiplayer Sidebar -->
        <MultiplayerGameSidebar
          :players="players"
          :current-player-id="playerId"
          :target-article="settings.targetArticle"
        />
      </div>
    </div>

    <!-- Leaderboard Phase -->
    <MultiplayerLeaderboard
      v-if="gameState === 'finished' && room"
      :leaderboard="sortedLeaderboard"
      :current-player-id="playerId"
      @play-again="handlePlayAgain"
      @leave="handleLeaveRoom"
    />

    <!-- Loading Overlay -->
    <div v-if="connecting" class="connection-overlay">
      <div class="connection-spinner"></div>
      <p>Connecting to server...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useMultiplayer } from '../composables/useMultiplayer'
import { useLanguageStore } from '../stores/language'
import LobbyEntry from '../components/multiplayer/LobbyEntry.vue'
import PreGameLobby from '../components/multiplayer/PreGameLobby.vue'
import MultiplayerGameSidebar from '../components/multiplayer/MultiplayerGameSidebar.vue'
import MultiplayerLeaderboard from '../components/multiplayer/MultiplayerLeaderboard.vue'
import GameInfoBar from '../components/singleplayer/GameInfoBar.vue'
import ArticleViewer from '../components/singleplayer/ArticleViewer.vue'

const router = useRouter()
const languageStore = useLanguageStore()

const emit = defineEmits(['game-started', 'game-ended'])

const {
  connected,
  playerId,
  roomCode,
  room,
  gameState,
  isHost,
  players,
  settings,
  currentPlayer,
  connect,
  disconnect,
  createRoom,
  joinRoom,
  updateSettings,
  startGame,
  sendArticleNavigation,
  sendReachTarget,
  endGame,
  leaveRoom,
  changeName
} = useMultiplayer()

const lobbyEntryRef = ref(null)
const connecting = ref(false)
const articleContentRef = ref(null)
const currentArticleTitle = ref('')
const currentArticleContent = ref('')
const loadingArticle = ref(false)
const timeRemaining = ref(null)
const timerInterval = ref(null)
const gameTimer = ref(null)

// Search functionality (like singleplayer)
const searchQuery = ref('')
const searchMatches = ref(0)
const currentSearchMatch = ref(0)
const articleViewerRef = ref(null)

// Navigation history
const navigationHistory = ref([])
const currentHistoryIndex = ref(-1)

const sortedLeaderboard = computed(() => {
  if (!room.value?.players) return []
  return [...room.value.players].sort((a, b) => (b.score || 0) - (a.score || 0))
})

const canGoBack = computed(() => {
  return currentHistoryIndex.value > 0
})

const canGoForward = computed(() => {
  return currentHistoryIndex.value < navigationHistory.value.length - 1
})

const formattedTime = computed(() => {
  if (timeRemaining.value === null) return '0:00'
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Connect on mount
onMounted(async () => {
  connecting.value = true
  connect()
  gameState.value = 'lobby-entry'
  
  // Wait for connection
  await new Promise(resolve => {
    const checkConnection = setInterval(() => {
      if (connected.value) {
        clearInterval(checkConnection)
        resolve()
      }
    }, 100)
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkConnection)
      resolve()
    }, 5000)
  })
  
  connecting.value = false
})

// Cleanup on unmount
onBeforeUnmount(() => {
  clearInterval(timerInterval.value)
  clearTimeout(gameTimer.value)
  if (gameState.value === 'playing') {
    leaveRoom()
  }
  disconnect()
})

// Watch for game state changes
watch(() => gameState.value, (newState) => {
  if (newState === 'playing' && room.value) {
    emit('game-started')
    // Start game timer
    startGameTimer()
    // Initialize navigation history
    navigationHistory.value = [settings.value.startArticle]
    currentHistoryIndex.value = 0
    // Load starting article
    loadArticle(settings.value.startArticle)
    // Sync language
    languageStore.setLanguage(settings.value.language)
  } else if (newState === 'finished') {
    emit('game-ended')
    clearInterval(timerInterval.value)
    clearTimeout(gameTimer.value)
  } else if (newState === 'lobby-entry' || newState === 'waiting') {
    emit('game-ended')
  }
})

// Handle create room
const handleCreateRoom = async (playerName) => {
  try {
    await createRoom(playerName)
  } catch (error) {
    console.error('Error creating room:', error)
    if (lobbyEntryRef.value) {
      lobbyEntryRef.value.setError(error.message || 'Failed to create room')
    }
  }
}

// Handle join room
const handleJoinRoom = async ({ code, name }) => {
  try {
    await joinRoom(code, name)
  } catch (error) {
    console.error('Error joining room:', error)
    if (lobbyEntryRef.value) {
      lobbyEntryRef.value.setError(error.message || 'Failed to join room')
    }
  }
}

// Handle update settings
const handleUpdateSettings = async (newSettings) => {
  try {
    await updateSettings(newSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
  }
}

// Handle change name
const handleChangeName = async (newName) => {
  try {
    await changeName(newName)
  } catch (error) {
    console.error('Error changing name:', error)
    throw error
  }
}

// Handle start game
const handleStartGame = async () => {
  try {
    // Use articles from settings if they were set by host
    const startArticle = settings.value.startArticle
    const targetArticle = settings.value.targetArticle
    
    if (!startArticle || !targetArticle) {
      alert('Please select start and target articles first.')
      return
    }
    
    await startGame(startArticle, targetArticle)
  } catch (error) {
    console.error('Error starting game:', error)
    alert('Failed to start game. Please try again.')
  }
}

// Handle article click
const handleArticleClick = (event) => {
  const target = event.target
  if (target.tagName === 'A' && target.href) {
    event.preventDefault()
    
    // Extract article title from link
    const url = new URL(target.href)
    const pathname = url.pathname
    
    // Extract title from pathname (e.g., /wiki/Article_Name)
    const match = pathname.match(/\/wiki\/(.+)/)
    if (match) {
      let articleTitle = decodeURIComponent(match[1])
      articleTitle = articleTitle.replace(/_/g, ' ')
      
      // Add to navigation history
      navigationHistory.value = navigationHistory.value.slice(0, currentHistoryIndex.value + 1)
      navigationHistory.value.push(articleTitle)
      currentHistoryIndex.value++
      
      // Update local player state immediately for instant feedback
      if (currentPlayer.value) {
        currentPlayer.value.currentArticle = articleTitle
        currentPlayer.value.clicks++
      }
      
      // Load new article
      loadArticle(articleTitle)
      
      // Send navigation to server (which will broadcast to others)
      sendArticleNavigation(articleTitle)
      
      // Check if reached target
      if (articleTitle === settings.value.targetArticle) {
        handleReachTarget()
      }
    }
  }
}

const goBack = () => {
  if (canGoBack.value) {
    currentHistoryIndex.value--
    const article = navigationHistory.value[currentHistoryIndex.value]
    loadArticle(article)
    sendArticleNavigation(article)
  }
}

const goForward = () => {
  if (canGoForward.value) {
    currentHistoryIndex.value++
    const article = navigationHistory.value[currentHistoryIndex.value]
    loadArticle(article)
    sendArticleNavigation(article)
  }
}

const handleSearchInput = (query) => {
  searchQuery.value = query
  if (!query) {
    clearSearch()
    return
  }
  performSearch()
}

const clearSearch = () => {
  searchQuery.value = ''
  searchMatches.value = 0
  currentSearchMatch.value = 0
  if (articleViewerRef.value?.articleContentRef) {
    const content = articleViewerRef.value.articleContentRef
    const highlights = content.querySelectorAll('.search-highlight')
    highlights.forEach(el => {
      const parent = el.parentNode
      parent.replaceChild(document.createTextNode(el.textContent), el)
      parent.normalize()
    })
  }
}

const performSearch = () => {
  if (!articleViewerRef.value?.articleContentRef || !searchQuery.value) return
  
  clearSearch()
  searchQuery.value = searchQuery.value // Keep the query
  
  const content = articleViewerRef.value.articleContentRef
  const text = content.textContent
  const regex = new RegExp(searchQuery.value, 'gi')
  const matches = text.match(regex)
  
  if (matches) {
    searchMatches.value = matches.length
    currentSearchMatch.value = 1
    highlightMatches()
  }
}

const highlightMatches = () => {
  if (!articleViewerRef.value?.articleContentRef) return
  
  const content = articleViewerRef.value.articleContentRef
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT)
  const textNodes = []
  
  while (walker.nextNode()) {
    if (walker.currentNode.parentElement?.tagName !== 'SCRIPT' &&
        walker.currentNode.parentElement?.tagName !== 'STYLE') {
      textNodes.push(walker.currentNode)
    }
  }
  
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  
  textNodes.forEach(node => {
    const text = node.textContent
    if (regex.test(text)) {
      const span = document.createElement('span')
      span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>')
      node.parentNode.replaceChild(span, node)
    }
  })
  
  scrollToCurrentMatch()
}

const previousMatch = () => {
  if (currentSearchMatch.value > 1) {
    currentSearchMatch.value--
    scrollToCurrentMatch()
  }
}

const nextMatch = () => {
  if (currentSearchMatch.value < searchMatches.value) {
    currentSearchMatch.value++
    scrollToCurrentMatch()
  }
}

const scrollToCurrentMatch = () => {
  if (!articleViewerRef.value?.articleContentRef) return
  
  const content = articleViewerRef.value.articleContentRef
  const highlights = content.querySelectorAll('.search-highlight')
  
  highlights.forEach((el, index) => {
    el.classList.remove('current-match')
    if (index === currentSearchMatch.value - 1) {
      el.classList.add('current-match')
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

// Load article
const loadArticle = async (title) => {
  loadingArticle.value = true
  currentArticleTitle.value = title
  
  try {
    const language = settings.value.language
    const baseUrl = 'http://localhost:3000'
    const response = await axios.get(
      `${baseUrl}/api/articles/${encodeURIComponent(title)}?language=${language}`
    )
    
    currentArticleContent.value = response.data.html
    
    // Scroll to top
    if (articleContentRef.value) {
      articleContentRef.value.scrollTop = 0
    }
  } catch (error) {
    console.error('Error loading article:', error)
    currentArticleContent.value = '<p>Error loading article. Please try again.</p>'
  } finally {
    loadingArticle.value = false
  }
}

// Handle reach target
const handleReachTarget = () => {
  sendReachTarget()
  // Show notification
  alert('Congratulations! You reached the target!')
}

// Start game timer
const startGameTimer = () => {
  if (!room.value?.startTime || !settings.value?.timeLimit) return
  
  const updateTimer = () => {
    const elapsed = Math.floor((Date.now() - room.value.startTime) / 1000)
    const total = settings.value.timeLimit * 60
    const remaining = Math.max(0, total - elapsed)
    
    timeRemaining.value = remaining
    
    if (remaining === 0) {
      handleTimeUp()
    }
  }
  
  updateTimer()
  timerInterval.value = setInterval(updateTimer, 1000)
  
  // Auto-end game when time is up
  const timeLimit = settings.value.timeLimit * 60 * 1000
  gameTimer.value = setTimeout(() => {
    handleTimeUp()
  }, timeLimit)
}

// Handle time up
const handleTimeUp = async () => {
  clearInterval(timerInterval.value)
  clearTimeout(gameTimer.value)
  
  if (isHost.value) {
    try {
      await endGame()
    } catch (error) {
      console.error('Error ending game:', error)
    }
  }
}

// Handle play again
const handlePlayAgain = () => {
  // Reset to waiting state
  if (room.value) {
    room.value.state = 'waiting'
    gameState.value = 'waiting'
    timeRemaining.value = null
    currentArticleTitle.value = ''
    currentArticleContent.value = ''
  }
}

// Handle leave room
const handleLeaveRoom = () => {
  leaveRoom()
  router.push('/')
}
</script>

<style scoped>
.multiplayer-view {
  position: relative;
  min-height: 100vh;
}

.background-gradient {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #cbf3f0;
  z-index: -1;
}

.connection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
  z-index: 2000;
}

.connection-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(46, 196, 182, 0.3);
  border-top-color: #2ec4b6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Game Layout */
.game-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
}

.game-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin-top: 53px; /* Space for GameInfoBar */
}

.article-viewer-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 768px) {
  .game-main {
    flex-direction: column-reverse;
  }
}
</style>
