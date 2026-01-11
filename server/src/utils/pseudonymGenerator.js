/**
 * Utility functions for generating room codes and handling player names
 */

/**
 * Generate a random 6-character room code
 * @returns {string} Room code (e.g., "A3X7K9")
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a default player name
 * @param {number} index - Player index (0-based)
 * @returns {string} Default name (e.g., "Player 1")
 */
export function generateDefaultName(index) {
  return `Player ${index + 1}`;
}

/**
 * Validate a player name
 * @param {string} name - Name to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validatePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Name must be 20 characters or less' };
  }

  // Allow letters, numbers, spaces, hyphens, and underscores
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }

  return { valid: true };
}
