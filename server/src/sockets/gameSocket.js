import multiplayerService from '../services/multiplayerService.js';
import { findPath } from '../services/pathfindingService.js';

/**
 * Setup Socket.IO event handlers for multiplayer game
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
export function setupGameSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create a new room
    socket.on('create-room', ({ playerName }, callback) => {
      try {
        const { code, room } = multiplayerService.createRoom(socket.id, playerName);
        socket.join(code);
        
        console.log(`Room created: ${code} by ${socket.id}`);
        
        callback({ 
          success: true, 
          code,
          room: sanitizeRoom(room),
          playerId: socket.id
        });
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Join an existing room
    socket.on('join-room', ({ roomCode, playerName }, callback) => {
      try {
        const result = multiplayerService.joinRoom(roomCode, socket.id, playerName);
        
        if (!result.success) {
          callback(result);
          return;
        }

        socket.join(roomCode.toUpperCase());
        
        console.log(`Player ${socket.id} joined room: ${roomCode}`);
        
        // Notify other players
        socket.to(roomCode.toUpperCase()).emit('player-joined', {
          player: result.room.players.find(p => p.id === socket.id)
        });
        
        callback({ 
          success: true, 
          room: sanitizeRoom(result.room),
          playerId: socket.id
        });
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Change player name
    socket.on('change-name', ({ newName }, callback) => {
      try {
        const room = multiplayerService.getRoomByPlayer(socket.id);
        if (!room) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        const result = multiplayerService.updatePlayerName(socket.id, newName);
        
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        // Notify all players in room
        io.to(room.code).emit('name-changed', {
          playerId: socket.id,
          newName
        });

        callback({ success: true });
      } catch (error) {
        console.error('Error changing name:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Update game settings (host only)
    socket.on('update-settings', ({ settings }, callback) => {
      try {
        const room = multiplayerService.getRoomByPlayer(socket.id);
        if (!room) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        if (room.host !== socket.id) {
          callback({ success: false, error: 'Only host can change settings' });
          return;
        }

        const success = multiplayerService.updateSettings(room.code, socket.id, settings);
        
        if (!success) {
          callback({ success: false, error: 'Failed to update settings' });
          return;
        }

        // Notify all players in room
        io.to(room.code).emit('settings-updated', { settings: room.settings });

        callback({ success: true });
      } catch (error) {
        console.error('Error updating settings:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Start game (host only)
    socket.on('start-game', ({ startArticle, targetArticle }, callback) => {
      try {
        const room = multiplayerService.getRoomByPlayer(socket.id);
        if (!room) {
          callback({ success: false, error: 'Not in a room' });
          return;
        }

        if (room.host !== socket.id) {
          callback({ success: false, error: 'Only host can start the game' });
          return;
        }

        if (room.players.length < 2) {
          callback({ success: false, error: 'Need at least 2 players' });
          return;
        }

        const success = multiplayerService.startGame(
          room.code, 
          socket.id, 
          startArticle, 
          targetArticle
        );

        if (!success) {
          callback({ success: false, error: 'Failed to start game' });
          return;
        }

        // Notify all players game is starting
        io.to(room.code).emit('game-started', {
          startArticle,
          targetArticle,
          timeLimit: room.settings.timeLimit,
          startTime: room.startTime
        });

        console.log(`Game started in room ${room.code}: ${startArticle} -> ${targetArticle}`);

        callback({ success: true });
      } catch (error) {
        console.error('Error starting game:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Player navigates to a new article
    socket.on('article-navigation', ({ article }) => {
      try {
        const room = multiplayerService.getRoomByPlayer(socket.id);
        if (!room || room.state !== 'playing') return;

        const success = multiplayerService.updatePlayerArticle(socket.id, article);
        if (!success) return;

        // Broadcast to all players in room
        socket.to(room.code).emit('player-article-updated', {
          playerId: socket.id,
          article,
          clicks: room.players.find(p => p.id === socket.id)?.clicks || 0
        });
      } catch (error) {
        console.error('Error handling article navigation:', error);
      }
    });

    // Player reached target
    socket.on('reach-target', async () => {
      try {
        const room = multiplayerService.getRoomByPlayer(socket.id);
        if (!room || room.state !== 'playing') return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.reached) return;

        multiplayerService.markPlayerReached(socket.id);

        const timeUsed = Math.floor((Date.now() - room.startTime) / 1000);
        const score = calculateScore(player.clicks, timeUsed, true, 0);
        
        multiplayerService.setPlayerScore(socket.id, score);

        // Notify all players
        io.to(room.code).emit('player-reached-target', {
          playerId: socket.id,
          playerName: player.name,
          clicks: player.clicks,
          timeUsed,
          score
        });

        console.log(`Player ${player.name} reached target in ${player.clicks} clicks`);

        // Check if all players finished or time is up
        // Timer is handled client-side; game ends when host calls end-game
      } catch (error) {
        console.error('Error handling reach target:', error);
      }
    });

    // End game and calculate final scores
    socket.on('end-game', async (callback) => {
      try {
        const room = multiplayerService.getRoomByPlayer(socket.id);
        if (!room || room.state !== 'playing') {
          callback({ success: false, error: 'Game not in progress' });
          return;
        }

        // Calculate scores for players who didn't reach target
        const scorePromises = room.players.map(async (player) => {
          if (player.reached && player.score !== null) {
            return { ...player };
          }

          // Calculate score based on distance from target
          try {
            const pathResult = await findPath(
              player.currentArticle || room.settings.startArticle,
              room.settings.targetArticle
            );

            const degrees = pathResult.degrees >= 0 ? pathResult.degrees : 6;
            const score = calculateScore(player.clicks, 0, false, degrees);
            
            multiplayerService.setPlayerScore(player.id, score);
            
            return { ...player, score };
          } catch (error) {
            console.error(`Error calculating score for ${player.name}:`, error);
            const score = calculateScore(player.clicks, 0, false, 6);
            multiplayerService.setPlayerScore(player.id, score);
            return { ...player, score };
          }
        });

        const scoredPlayers = await Promise.all(scorePromises);
        
        // Sort by score descending
        scoredPlayers.sort((a, b) => (b.score || 0) - (a.score || 0));

        multiplayerService.endGame(room.code);

        // Send final leaderboard to all players
        io.to(room.code).emit('game-ended', {
          leaderboard: scoredPlayers.map(p => ({
            id: p.id,
            name: p.name,
            clicks: p.clicks,
            reached: p.reached,
            score: p.score
          }))
        });

        console.log(`Game ended in room ${room.code}`);

        callback({ success: true });
      } catch (error) {
        console.error('Error ending game:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Leave room
    socket.on('leave-room', () => {
      try {
        const room = multiplayerService.getRoomByPlayer(socket.id);
        if (!room) return;

        const roomCode = room.code;
        const wasHost = room.host === socket.id;
        
        const updatedRoom = multiplayerService.removePlayer(socket.id);
        socket.leave(roomCode);

        if (updatedRoom) {
          // Notify remaining players
          io.to(roomCode).emit('player-left', {
            playerId: socket.id
          });

          // If host changed, notify
          if (wasHost && updatedRoom.host) {
            io.to(roomCode).emit('host-changed', {
              newHostId: updatedRoom.host
            });
          }
        }

        console.log(`Player ${socket.id} left room ${roomCode}`);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        const room = multiplayerService.getRoomByPlayer(socket.id);
        if (!room) {
          console.log(`Player disconnected: ${socket.id}`);
          return;
        }

        const roomCode = room.code;
        const wasHost = room.host === socket.id;

        // If game is playing, mark as disconnected but keep in room
        if (room.state === 'playing') {
          socket.to(roomCode).emit('player-disconnected', {
            playerId: socket.id
          });
          console.log(`Player ${socket.id} disconnected during game in room ${roomCode}`);
        } else {
          // If waiting, remove from room
          const updatedRoom = multiplayerService.removePlayer(socket.id);
          
          if (updatedRoom) {
            io.to(roomCode).emit('player-left', {
              playerId: socket.id
            });

            if (wasHost && updatedRoom.host) {
              io.to(roomCode).emit('host-changed', {
                newHostId: updatedRoom.host
              });
            }
          }
          console.log(`Player ${socket.id} disconnected and removed from room ${roomCode}`);
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  console.log('Socket.IO game handlers initialized');
}

/**
 * Calculate player score
 * @param {number} clicks - Number of clicks
 * @param {number} timeUsed - Time used in seconds
 * @param {boolean} reached - Whether player reached target
 * @param {number} degrees - Degrees of separation (for players who didn't reach)
 * @returns {number} Score
 */
function calculateScore(clicks, timeUsed, reached, degrees) {
  if (reached) {
    // Reached target: 1000 - (clicks × 10) - (timeUsed × 2)
    const score = 1000 - (clicks * 10) - (timeUsed * 2);
    return Math.max(0, score);
  } else {
    // Didn't reach: 500 - (degrees × 100) - (clicks × 5)
    const score = 500 - (degrees * 100) - (clicks * 5);
    return Math.max(0, score);
  }
}

/**
 * Remove sensitive data from room object before sending to client
 * @param {Object} room - Room object
 * @returns {Object} Sanitized room
 */
function sanitizeRoom(room) {
  return {
    code: room.code,
    host: room.host,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      currentArticle: p.currentArticle,
      clicks: p.clicks,
      reached: p.reached,
      score: p.score
    })),
    settings: room.settings,
    state: room.state,
    startTime: room.startTime
  };
}
