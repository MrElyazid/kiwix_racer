<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header" :class="headerClass">
          <h2 class="modal-title">{{ title }}</h2>
        </div>

        <div class="modal-body">
          <p class="modal-message">{{ message }}</p>

          <div v-if="stats" class="stats-container">
            <div v-if="stats.clicks !== undefined" class="stat-item">
              <span class="stat-label">Clicks:</span>
              <span class="stat-value">{{ stats.clicks }}</span>
            </div>
            <div v-if="stats.time" class="stat-item">
              <span class="stat-label">Time:</span>
              <span class="stat-value">{{ stats.time }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            v-if="showPlayAgain"
            class="button is-primary modal-button"
            @click="$emit('play-again')"
          >
            Play Again
          </button>
          <button
            class="button modal-button"
            :class="showPlayAgain ? 'is-light' : 'is-primary'"
            @click="$emit('close')"
          >
            {{ showPlayAgain ? "Close" : "OK" }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  show: Boolean,
  type: {
    type: String,
    default: "info", // 'success', 'error', 'info'
  },
  title: String,
  message: String,
  stats: Object,
  showPlayAgain: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close", "play-again"]);

const headerClass = computed(() => {
  switch (props.type) {
    case "success":
      return "header-success";
    case "error":
      return "header-error";
    case "info":
    default:
      return "header-info";
  }
});

function handleOverlayClick() {
  // Close modal when clicking outside
  props.$emit("close");
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border: 3px solid #2ec4b6;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  overflow: hidden;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 2rem;
  text-align: center;
  color: white;
  position: relative;
}

.header-success {
  background: #2ec4b6;
}

.header-error {
  background: #ff9f1c;
}

.header-info {
  background: #2ec4b6;
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Bagel Fat One', cursive;
}

.modal-body {
  padding: 2rem;
}

.modal-message {
  font-size: 1.125rem;
  color: #363636;
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-family: 'Google Sans Code', 'Courier New', monospace;
}

.stats-container {
  background: #cbf3f0;
  padding: 1.5rem;
  display: flex;
  gap: 2rem;
  justify-content: center;
  border: 3px solid #2ec4b6;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #2ec4b6;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Chewy', cursive;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  font-family: 'Google Sans Code', 'Courier New', monospace;
}

.modal-footer {
  padding: 1.5rem 2rem;
  background: #f8f9fa;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.modal-button {
  min-width: 120px;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  transition: all 0.2s ease;
  font-family: 'Chewy', cursive;
  border: 3px solid;
}

.modal-button.is-primary {
  background: #2ec4b6;
  border-color: #2ec4b6;
  color: white;
}

.modal-button.is-primary:hover {
  text-decoration: underline;
}

.modal-button.is-light {
  background: white;
  border-color: #2ec4b6;
  color: #2ec4b6;
}

.modal-button.is-light:hover {
  text-decoration: underline;
}

/* Transition animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  animation: slideDown 0.3s ease-out;
}

.modal-fade-leave-active .modal-content {
  animation: slideUp 0.3s ease-in;
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
}
</style>
