import { ref, computed } from 'vue'
import { io } from 'socket.io-client'

// For Socket.IO, we need the base URL without /api
const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export function useMultiplayer() {
  const socket = ref(null)
  const connected = ref(false)
  const playerId = ref(null)
  const roomCode = ref(null)
  const room = ref(null)
  const error = ref(null)
  const gameState = ref('disconnected') // disconnected, lobby-entry, waiting, playing, finished

  // Computed properties
  const isHost = computed(() => {
    return room.value && playerId.value && room.value.host === playerId.value
  })

  const players = computed(() => {
    return room.value?.players || []
  })

  const settings = computed(() => {
    return room.value?.settings || { timeLimit: 5, language: 'en' }
  })

  const currentPlayer = computed(() => {
    if (!room.value || !playerId.value) return null
    return room.value.players.find(p => p.id === playerId.value)
  })

  // Connect to Socket.IO server
  const connect = () => {
    if (socket.value?.connected) return
    
    socket.value = io(SERVER_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      withCredentials: true
    })

    socket.value.on('connect', () => {
      connected.value = true
      playerId.value = socket.value.id
    })

    socket.value.on('disconnect', () => {
      connected.value = false
    })

    socket.value.on('connect_error', (err) => {
      console.error('Connection error:', err)
      error.value = 'Failed to connect to server'
    })

    // Room events
    setupRoomEventListeners()
  }

  // Setup event listeners for room updates
  const setupRoomEventListeners = () => {
    if (!socket.value) return

    // Player joined
    socket.value.on('player-joined', ({ player }) => {
      if (room.value) {
        room.value.players.push(player)
      }
    })

    // Player left
    socket.value.on('player-left', ({ playerId: leftPlayerId }) => {
      if (room.value) {
        room.value.players = room.value.players.filter(p => p.id !== leftPlayerId)
      }
    })

    // Host changed
    socket.value.on('host-changed', ({ newHostId }) => {
      if (room.value) {
        room.value.host = newHostId
      }
    })

    // Name changed
    socket.value.on('name-changed', ({ playerId: changedPlayerId, newName }) => {
      if (room.value) {
        const player = room.value.players.find(p => p.id === changedPlayerId)
        if (player) {
          player.name = newName
        }
      }
    })

    // Settings updated
    socket.value.on('settings-updated', ({ settings: newSettings }) => {
      if (room.value) {
        room.value.settings = newSettings
      }
    })

    // Game started
    socket.value.on('game-started', ({ startArticle, targetArticle, timeLimit, startTime }) => {
      if (room.value) {
        room.value.state = 'playing'
        room.value.startTime = startTime
        room.value.settings.startArticle = startArticle
        room.value.settings.targetArticle = targetArticle
        gameState.value = 'playing'
      }
    })

    // Player article updated
    socket.value.on('player-article-updated', ({ playerId: updatedPlayerId, article, clicks }) => {
      if (room.value) {
        const player = room.value.players.find(p => p.id === updatedPlayerId)
        if (player) {
          player.currentArticle = article
          player.clicks = clicks
        }
      }
    })

    // Player reached target
    socket.value.on('player-reached-target', ({ playerId: reachedPlayerId, clicks, timeUsed, score }) => {
      if (room.value) {
        const player = room.value.players.find(p => p.id === reachedPlayerId)
        if (player) {
          player.reached = true
          player.clicks = clicks
          player.score = score
        }
      }
    })

    // Game ended
    socket.value.on('game-ended', ({ leaderboard }) => {
      if (room.value) {
        room.value.state = 'finished'
        // Update players with final scores
        leaderboard.forEach(scoredPlayer => {
          const player = room.value.players.find(p => p.id === scoredPlayer.id)
          if (player) {
            Object.assign(player, scoredPlayer)
          }
        })
        gameState.value = 'finished'
        console.log('Game ended, leaderboard:', leaderboard)
      }
    })

    // Player disconnected
    socket.value.on('player-disconnected', ({ playerId: disconnectedPlayerId }) => {
      console.log('Player disconnected:', disconnectedPlayerId)
      // Could add visual indicator that player disconnected
    })
  }

  // Create a new room
  const createRoom = (playerName) => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error('Not connected to server'))
        return
      }

      socket.value.emit('create-room', { playerName }, (response) => {
        if (response.success) {
          roomCode.value = response.code
          room.value = response.room
          playerId.value = response.playerId
          gameState.value = 'waiting'
          error.value = null
          resolve(response)
        } else {
          error.value = response.error
          reject(new Error(response.error))
        }
      })
    })
  }

  // Join an existing room
  const joinRoom = (code, playerName) => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error('Not connected to server'))
        return
      }

      socket.value.emit('join-room', { roomCode: code, playerName }, (response) => {
        if (response.success) {
          roomCode.value = code.toUpperCase()
          room.value = response.room
          playerId.value = response.playerId
          gameState.value = 'waiting'
          error.value = null
          resolve(response)
        } else {
          error.value = response.error
          reject(new Error(response.error))
        }
      })
    })
  }

  // Change player name
  const changeName = (newName) => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error('Not connected to server'))
        return
      }

      socket.value.emit('change-name', { newName }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  // Update settings (host only)
  const updateSettings = (newSettings) => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error('Not connected to server'))
        return
      }

      socket.value.emit('update-settings', { settings: newSettings }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  // Start game (host only)
  const startGame = (startArticle, targetArticle) => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error('Not connected to server'))
        return
      }

      socket.value.emit('start-game', { startArticle, targetArticle }, (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  // Send article navigation
  const sendArticleNavigation = (article) => {
    if (!socket.value) return
    socket.value.emit('article-navigation', { article })
  }

  // Send reach target
  const sendReachTarget = () => {
    if (!socket.value) return
    socket.value.emit('reach-target')
  }

  // End game
  const endGame = () => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error('Not connected to server'))
        return
      }

      socket.value.emit('end-game', (response) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  // Leave room
  const leaveRoom = () => {
    if (!socket.value) return

    socket.value.emit('leave-room')
    roomCode.value = null
    room.value = null
    gameState.value = 'lobby-entry'
    error.value = null
  }

  // Disconnect from server
  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
      playerId.value = null
      roomCode.value = null
      room.value = null
      gameState.value = 'disconnected'
    }
  }

  // Reset to lobby entry
  const resetToLobby = () => {
    leaveRoom()
    gameState.value = 'lobby-entry'
  }

  return {
    // State
    socket,
    connected,
    playerId,
    roomCode,
    room,
    error,
    gameState,
    
    // Computed
    isHost,
    players,
    settings,
    currentPlayer,
    
    // Methods
    connect,
    disconnect,
    createRoom,
    joinRoom,
    changeName,
    updateSettings,
    startGame,
    sendArticleNavigation,
    sendReachTarget,
    endGame,
    leaveRoom,
    resetToLobby
  }
}
