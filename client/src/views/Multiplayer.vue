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

    <!-- Game Notification Modal -->
    <GameNotification
      :show="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      :stats="notification.stats"
      :show-play-again="notification.showPlayAgain"
      @close="closeNotification"
      @play-again="handlePlayAgain"
    />
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
import GameNotification from '../components/singleplayer/GameNotification.vue'

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

// Notification state
const notification = ref({
  show: false,
  type: "info",
  title: "",
  message: "",
  stats: null,
  showPlayAgain: false,
})

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

const elapsedTime = computed(() => {
  if (!settings.value?.timeLimit || timeRemaining.value === null) return '0:00'
  const totalSeconds = (settings.value.timeLimit * 60) - timeRemaining.value
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
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

// Watch for room players changes to check if all finished
watch(() => room.value?.players, (players) => {
  if (gameState.value === 'playing' && players && players.length > 0) {
    checkIfAllPlayersFinished()
  }
}, { deep: true })

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

  if (target.tagName === "IMG") {
    event.preventDefault()
    return
  }

  const link = target.closest("a")
  if (link && link.href) {
    if (link.querySelector("img")) {
      event.preventDefault()
      return
    }

    event.preventDefault()

    const href = link.getAttribute("href")

    if (href && (href.includes("wikipedia") || href.startsWith("http"))) {
      return
    }

    if (href && !href.startsWith("#")) {
      let path

      if (href.startsWith("./")) {
        path = decodeURIComponent(href.substring(2)).split("#")[0]
        if (path.includes(":")) return
      } else {
        return
      }

      if (path) {
        // Add to navigation history
        navigationHistory.value = navigationHistory.value.slice(0, currentHistoryIndex.value + 1)
        navigationHistory.value.push(path)
        currentHistoryIndex.value++
        
        // Update local player state immediately for instant feedback
        if (currentPlayer.value) {
          currentPlayer.value.currentArticle = path
          currentPlayer.value.clicks++
        }
        
        // Load new article
        loadArticle(path)
        
        // Send navigation to server (which will broadcast to others)
        sendArticleNavigation(path)
        
        // Check if reached target
        const articleTitle = path.replace(/_/g, ' ')
        if (articleTitle === settings.value.targetArticle) {
          handleReachTarget()
        }
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
  handleSearch()
}

const handleSearch = () => {
  if (!searchQuery.value) {
    clearSearch()
    return
  }

  const searchText = searchQuery.value.toLowerCase()
  const articleContent = articleViewerRef.value?.articleContentRef

  if (!articleContent) return

  removeHighlights()

  const matches = []
  highlightTextNodes(articleContent, searchText, matches)

  searchMatches.value = matches.length
  currentSearchMatch.value = matches.length > 0 ? 1 : 0

  if (matches.length > 0) {
    matches[0].scrollIntoView({ behavior: "smooth", block: "center" })
    matches[0].classList.add("current-match")
  }
}

const highlightTextNodes = (node, searchText, matches) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.toLowerCase()
    const index = text.indexOf(searchText)

    if (index !== -1) {
      const parent = node.parentNode

      const before = node.textContent.substring(0, index)
      const match = node.textContent.substring(
        index,
        index + searchText.length
      )
      const after = node.textContent.substring(index + searchText.length)

      const beforeNode = document.createTextNode(before)
      const matchNode = document.createElement("mark")
      matchNode.className = "search-highlight"
      matchNode.textContent = match
      const afterNode = document.createTextNode(after)

      parent.insertBefore(beforeNode, node)
      parent.insertBefore(matchNode, node)
      parent.insertBefore(afterNode, node)
      parent.removeChild(node)

      matches.push(matchNode)

      if (after.toLowerCase().indexOf(searchText) !== -1) {
        highlightTextNodes(afterNode, searchText, matches)
      }
    }
  } else if (
    node.nodeType === Node.ELEMENT_NODE &&
    node.tagName !== "SCRIPT" &&
    node.tagName !== "STYLE"
  ) {
    Array.from(node.childNodes).forEach((child) => {
      highlightTextNodes(child, searchText, matches)
    })
  }
}

const removeHighlights = () => {
  const highlights = document.querySelectorAll(".search-highlight")
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode
    parent.replaceChild(
      document.createTextNode(highlight.textContent),
      highlight
    )
    parent.normalize()
  })
}

const clearSearch = () => {
  searchQuery.value = ''
  searchMatches.value = 0
  currentSearchMatch.value = 0
  removeHighlights()
}

const nextMatch = () => {
  const highlights = document.querySelectorAll(".search-highlight")
  if (highlights.length === 0) return

  document.querySelectorAll(".current-match").forEach((el) => {
    el.classList.remove("current-match")
  })

  currentSearchMatch.value = (currentSearchMatch.value % highlights.length) + 1
  const nextHighlight = highlights[currentSearchMatch.value - 1]
  nextHighlight.classList.add("current-match")
  nextHighlight.scrollIntoView({ behavior: "smooth", block: "center" })
}

const previousMatch = () => {
  const highlights = document.querySelectorAll(".search-highlight")
  if (highlights.length === 0) return

  document.querySelectorAll(".current-match").forEach((el) => {
    el.classList.remove("current-match")
  })

  currentSearchMatch.value =
    currentSearchMatch.value === 1
      ? highlights.length
      : currentSearchMatch.value - 1
  const prevHighlight = highlights[currentSearchMatch.value - 1]
  prevHighlight.classList.add("current-match")
  prevHighlight.scrollIntoView({ behavior: "smooth", block: "center" })
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
const handleReachTarget = async () => {
  sendReachTarget()
  
  // Show notification
  notification.value = {
    show: true,
    type: "success",
    title: "Congratulations!",
    message: "You reached the target article!",
    stats: {
      clicks: currentPlayer.value?.clicks || 0,
      time: elapsedTime.value,
    },
    showPlayAgain: false,
  }

  // Check if all players have finished
  // Note: Wait a bit for the server to update the room state
  setTimeout(() => {
    checkIfAllPlayersFinished()
  }, 500)
}

const checkIfAllPlayersFinished = async () => {
  if (!room.value?.players) return
  
  // Check if all players have reached the target
  const allFinished = room.value.players.every(player => player.reached === true)
  
  if (allFinished && isHost.value) {
    console.log('All players finished! Ending game...')
    // If host and all players finished, end the game
    try {
      await endGame()
    } catch (error) {
      console.error('Error ending game:', error)
    }
  }
}

const closeNotification = () => {
  notification.value.show = false
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
