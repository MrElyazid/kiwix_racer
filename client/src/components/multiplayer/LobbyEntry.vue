<template>
  <div class="lobby-entry">
    <P5Background />
    <div class="entry-container">
      <h1 class="title">Multiplayer Mode</h1>
      <p class="subtitle">Race against friends to reach the target article!</p>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Player Name Input -->
      <div class="name-section">
        <label class="name-label">Your Name</label>
        <input
          v-model="playerName"
          type="text"
          placeholder="Enter your name"
          class="name-input"
          maxlength="20"
          @input="handleNameInput"
          @keyup.enter="playerName.length >= 2 ? handleCreate() : null"
        />
        <p class="name-hint">2-20 characters, letters, numbers, spaces, hyphens, underscores</p>
      </div>

      <div class="action-section">
        <button 
          class="create-button"
          @click="handleCreate"
          :disabled="loading || playerName.length < 2"
        >
          <span>Create Room</span>
        </button>

        <div class="divider">
          <span>OR</span>
        </div>

        <div class="join-section">
          <input
            v-model="joinCode"
            type="text"
            placeholder="Enter room code"
            class="code-input"
            maxlength="6"
            @input="handleCodeInput"
            @keyup.enter="handleJoin"
            :disabled="loading"
          />
          <button 
            class="join-button"
            @click="handleJoin"
            :disabled="loading || !joinCode || joinCode.length < 6 || playerName.length < 2"
          >
            Join Room
          </button>
        </div>
      </div>

      <div class="info-box">
        <p class="info-text">
          <strong>How it works:</strong><br>
          Create a room and share the code, or join an existing room. 
          Up to 25 players can compete simultaneously!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import P5Background from '@/components/P5Background.vue'

const emit = defineEmits(['create-room', 'join-room'])

const playerName = ref('')
const joinCode = ref('')
const loading = ref(false)
const error = ref(null)

const handleNameInput = (e) => {
  // Allow letters, numbers, spaces, hyphens, and underscores
  const value = e.target.value
  playerName.value = value.replace(/[^a-zA-Z0-9 _-]/g, '')
}

const handleCodeInput = (e) => {
  // Convert to uppercase and remove non-alphanumeric
  joinCode.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

const handleCreate = () => {
  if (loading.value || playerName.value.length < 2) return
  loading.value = true
  error.value = null
  emit('create-room', playerName.value.trim())
  // Reset loading after a delay (will be handled by parent on success)
  setTimeout(() => {
    loading.value = false
  }, 2000)
}

const handleJoin = () => {
  if (loading.value || !joinCode.value || joinCode.value.length < 6 || playerName.value.length < 2) return
  loading.value = true
  error.value = null
  emit('join-room', { code: joinCode.value, name: playerName.value.trim() })
  // Reset loading after a delay
  setTimeout(() => {
    loading.value = false
  }, 2000)
}

defineExpose({
  setError: (msg) => {
    error.value = msg
    loading.value = false
  }
})
</script>

<style scoped>
.lobby-entry {
  min-height: 100vh;
  padding: 2rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-container {
  width: 100%;
  max-width: 500px;
  background: var(--color-white);
  border: 3px solid #2ec4b6;
  padding: 3rem 2.5rem;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.1);
  position: relative;
}

.title {
  font-family: 'Bagel Fat One', cursive;
  font-size: 2.5rem;
  color: #2ec4b6;
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-family: 'Chewy', cursive;
  font-weight: 400;
  text-align: center;
  color: #333;
  font-size: 1rem;
  margin-bottom: 2rem;
}

.error-message {
  background: #fca5a5;
  border: 3px solid #dc2626;
  padding: 0.875rem;
  color: #7f1d1d;
  font-family: 'DynaPuff', cursive;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1.5rem;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.create-button {
  width: 100%;
  background: #2ec4b6;
  color: var(--color-white);
  border: 3px solid #2ec4b6;
  padding: 1.125rem 2rem;
  font-family: 'Chewy', cursive;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.create-button:hover:not(:disabled) {
  text-decoration: underline;
}

.create-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.create-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #666;
  font-family: 'Chewy', cursive;
  font-weight: 600;
  font-size: 0.875rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 2px solid var(--color-teal);
}

.divider span {
  padding: 0 1rem;
}

.join-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.code-input {
  width: 100%;
  padding: 1rem;
  border: 3px solid #2ec4b6;
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.2em;
  color: #1e293b;
  background: var(--color-white);
  transition: border-color 0.15s ease;
}

.code-input:focus {
  outline: none;
  border-color: #ff9f1c;
}

.code-input::placeholder {
  color: #94a3b8;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.join-button {
  width: 100%;
  background: var(--color-white);
  color: var(--color-teal);
  border: 3px solid var(--color-teal);
  padding: 1rem 2rem;
  font-family: 'Chewy', cursive;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.join-button:hover:not(:disabled) {
  text-decoration: underline;
}

.join-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.join-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Name Section */
.name-section {
  margin-bottom: 2rem;
}

.name-label {
  display: block;
  font-family: 'Chewy', cursive;
  font-weight: 400;
  color: #333;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.name-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 3px solid #2ec4b6;
  background: var(--color-white);
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  transition: border-color 0.15s ease;
}

.name-input:focus {
  outline: none;
  border-color: #ff9f1c;
}

.name-input:disabled {
  background: #f8f8f8;
  cursor: not-allowed;
  opacity: 0.7;
}

.name-hint {
  margin-top: 0.5rem;
  font-family: 'DynaPuff', cursive;
  font-size: 0.75rem;
  font-weight: 400;
  color: #666;
  font-style: italic;
}

.info-box {
  margin-top: 2rem;
  padding: 1.25rem;
  background: var(--color-teal-light);
  border: 2px solid var(--color-teal);
}

.info-text {
  font-family: 'DynaPuff', cursive;
  font-weight: 400;
  color: #333;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
}

.info-text strong {
  font-weight: 700;
  color: #000;
}

@media (max-width: 480px) {
  .title {
    font-size: 2rem;
  }

  .entry-container {
    padding: 2rem 1.5rem;
  }

  .code-input {
    font-size: 1rem;
  }
}
</style>

