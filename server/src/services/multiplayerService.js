import { generateRoomCode, generateDefaultName, validatePlayerName } from '../utils/pseudonymGenerator.js';

/**
 * In-memory storage for multiplayer rooms
 * Structure: Map<roomId, Room>
 * Room: {
 *   code: string,
 *   host: string (socketId),
 *   players: Player[],
 *   settings: { timeLimit: number, language: string, startArticle: string, targetArticle: string },
 *   state: 'waiting' | 'playing' | 'finished',
 *   startTime: number | null,
 *   createdAt: number
 * }
 * Player: {
 *   id: string (socketId),
 *   name: string,
 *   currentArticle: string,
 *   clicks: number,
 *   reached: boolean,
 *   score: number | null
 * }
 */
class MultiplayerService {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map(); // Map<socketId, roomCode>
    
    // Cleanup interval: remove empty/finished rooms periodically
    this.startCleanupInterval();
  }

  /**
   * Create a new room
   * @param {string} hostSocketId - Socket ID of the host
   * @returns {Object} Room data
   */
  createRoom(hostSocketId, playerName = null) {
    const code = this.generateUniqueRoomCode();
    const usedNames = new Set();
    
    // Use provided name or generate default
    const hostName = playerName && playerName.trim() ? playerName.trim() : generateDefaultName(0);
    usedNames.add(hostName.toLowerCase()); // Store lowercase for case-insensitive comparison

    const room = {
      code,
      host: hostSocketId,
      players: [{
        id: hostSocketId,
        name: hostName,
        currentArticle: '',
        clicks: 0,
        reached: false,
        score: null
      }],
      usedNames,
      settings: {
        timeLimit: 5,
        language: 'en',
        startArticle: '',
        targetArticle: ''
      },
      state: 'waiting',
      startTime: null,
      createdAt: Date.now()
    };

    this.rooms.set(code, room);
    this.playerRooms.set(hostSocketId, code);

    return { code, room };
  }

  /**
   * Join an existing room
   * @param {string} roomCode - Room code to join
   * @param {string} socketId - Socket ID of the player
   * @returns {Object|null} Room data or null if failed
   */
  joinRoom(roomCode, socketId, playerName = null) {
    const room = this.rooms.get(roomCode.toUpperCase());
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.state !== 'waiting') {
      return { success: false, error: 'Game already in progress' };
    }

    if (room.players.length >= 25) {
      return { success: false, error: 'Room is full' };
    }

    // Check if player is already in the room
    if (room.players.some(p => p.id === socketId)) {
      return { success: false, error: 'Already in room' };
    }

    // Use provided name or generate default
    const name = playerName && playerName.trim() ? playerName.trim() : generateDefaultName(room.players.length);
    
    // Check if name is already taken (case-insensitive)
    if (room.usedNames.has(name.toLowerCase())) {
      return { success: false, error: 'Username already taken in this room' };
    }
    
    room.usedNames.add(name.toLowerCase());

    const newPlayer = {
      id: socketId,
      name: name,
      currentArticle: '',
      clicks: 0,
      reached: false,
      score: null
    };

    room.players.push(newPlayer);
    this.playerRooms.set(socketId, roomCode.toUpperCase());

    return { success: true, room };
  }

  /**
   * Get room by code
   * @param {string} roomCode - Room code
   * @returns {Object|null} Room data or null
   */
  getRoom(roomCode) {
    return this.rooms.get(roomCode.toUpperCase());
  }

  /**
   * Get room by player socket ID
   * @param {string} socketId - Player's socket ID
   * @returns {Object|null} Room data or null
   */
  getRoomByPlayer(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    if (!roomCode) return null;
    return this.rooms.get(roomCode);
  }

  /**
   * Update player name
   * @param {string} socketId - Player's socket ID
   * @param {string} newName - New name
   * @returns {boolean} Success status
   */
  updatePlayerName(socketId, newName) {
    const room = this.getRoomByPlayer(socketId);
    if (!room) return { success: false, error: 'Not in a room' };

    const player = room.players.find(p => p.id === socketId);
    if (!player) return { success: false, error: 'Player not found' };

    // Validate name
    const validation = validatePlayerName(newName);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmedName = newName.trim();

    // Check if name is already taken (case-insensitive, excluding own name)
    if (room.usedNames.has(trimmedName.toLowerCase()) && player.name.toLowerCase() !== trimmedName.toLowerCase()) {
      return { success: false, error: 'Username already taken in this room' };
    }

    // Update used names
    room.usedNames.delete(player.name.toLowerCase());
    room.usedNames.add(trimmedName.toLowerCase());
    player.name = trimmedName;

    return { success: true };
  }

  /**
   * Update game settings (host only)
   * @param {string} roomCode - Room code
   * @param {string} hostSocketId - Host's socket ID
   * @param {Object} newSettings - Settings to update
   * @returns {boolean} Success status
   */
  updateSettings(roomCode, hostSocketId, newSettings) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || room.host !== hostSocketId) return false;

    room.settings = { ...room.settings, ...newSettings };
    return true;
  }

  /**
   * Start game (host only)
   * @param {string} roomCode - Room code
   * @param {string} hostSocketId - Host's socket ID
   * @param {string} startArticle - Starting article
   * @param {string} targetArticle - Target article
   * @returns {boolean} Success status
   */
  startGame(roomCode, hostSocketId, startArticle, targetArticle) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || room.host !== hostSocketId || room.state !== 'waiting') {
      return false;
    }

    room.state = 'playing';
    room.startTime = Date.now();
    room.settings.startArticle = startArticle;
    room.settings.targetArticle = targetArticle;

    // Reset player stats
    room.players.forEach(player => {
      player.currentArticle = startArticle;
      player.clicks = 0;
      player.reached = false;
      player.score = null;
    });

    return true;
  }

  /**
   * Update player's current article
   * @param {string} socketId - Player's socket ID
   * @param {string} article - Current article title
   */
  updatePlayerArticle(socketId, article) {
    const room = this.getRoomByPlayer(socketId);
    if (!room || room.state !== 'playing') return false;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return false;

    player.currentArticle = article;
    player.clicks++;

    return true;
  }

  /**
   * Mark player as reached target
   * @param {string} socketId - Player's socket ID
   */
  markPlayerReached(socketId) {
    const room = this.getRoomByPlayer(socketId);
    if (!room || room.state !== 'playing') return false;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return false;

    player.reached = true;
    return true;
  }

  /**
   * Set player score
   * @param {string} socketId - Player's socket ID
   * @param {number} score - Player's score
   */
  setPlayerScore(socketId, score) {
    const room = this.getRoomByPlayer(socketId);
    if (!room) return false;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return false;

    player.score = score;
    return true;
  }

  /**
   * End game and transition to finished state
   * @param {string} roomCode - Room code
   */
  endGame(roomCode) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return false;

    room.state = 'finished';
    return true;
  }

  /**
   * Remove player from room
   * @param {string} socketId - Player's socket ID
   * @returns {Object|null} Room data if still exists
   */
  removePlayer(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.playerRooms.delete(socketId);
      return null;
    }

    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex === -1) return room;

    const player = room.players[playerIndex];
    room.usedNames.delete(player.name.toLowerCase());
    room.players.splice(playerIndex, 1);
    this.playerRooms.delete(socketId);

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return null;
    }

    // If host left, promote first player to host
    if (room.host === socketId && room.players.length > 0) {
      room.host = room.players[0].id;
    }

    return room;
  }

  /**
   * Generate a unique room code
   * @returns {string} Unique room code
   */
  generateUniqueRoomCode() {
    let code;
    let attempts = 0;
    do {
      code = generateRoomCode();
      attempts++;
    } while (this.rooms.has(code) && attempts < 100);

    if (attempts >= 100) {
      // Fallback: append timestamp
      code = generateRoomCode() + Date.now().toString().slice(-2);
    }

    return code;
  }

  /**
   * Cleanup old rooms periodically
   */
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      const FIVE_MINUTES = 5 * 60 * 1000;
      const THIRTY_MINUTES = 30 * 60 * 1000;

      for (const [code, room] of this.rooms.entries()) {
        // Remove empty rooms after 5 minutes
        if (room.players.length === 0 && now - room.createdAt > FIVE_MINUTES) {
          this.rooms.delete(code);
          console.log(`Cleaned up empty room: ${code}`);
        }
        // Remove finished rooms after 30 minutes
        else if (room.state === 'finished' && room.startTime && now - room.startTime > THIRTY_MINUTES) {
          // Remove all players from playerRooms map
          room.players.forEach(player => {
            this.playerRooms.delete(player.id);
          });
          this.rooms.delete(code);
          console.log(`Cleaned up finished room: ${code}`);
        }
      }
    }, 60000); // Run every minute
  }

  /**
   * Get room statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: this.playerRooms.size,
      activeGames: Array.from(this.rooms.values()).filter(r => r.state === 'playing').length
    };
  }
}

// Singleton instance
const multiplayerService = new MultiplayerService();

export default multiplayerService;
