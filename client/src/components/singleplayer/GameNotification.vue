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

const icon = computed(() => {
  switch (props.type) {
    case "success":
      return "🎉";
    case "error":
      return "⏰";
    case "info":
    default:
      return "ℹ️";
  }
});

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
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
  background: linear-gradient(135deg, #48c774 0%, #3ec46d 100%);
}

.header-error {
  background: linear-gradient(135deg, #f14668 0%, #e63946 100%);
}

.header-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.modal-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
  animation: bounce 0.6s ease-in-out;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
}

.stats-container {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 2rem;
  justify-content: center;
  border: 2px solid #667eea;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #667eea;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
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
  border-radius: 8px;
  transition: all 0.2s ease;
}

.modal-button.is-primary {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.modal-button.is-primary:hover {
  background: #764ba2;
  border-color: #764ba2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.modal-button.is-light {
  background: white;
  border: 2px solid #dbdbdb;
  color: #363636;
}

.modal-button.is-light:hover {
  border-color: #667eea;
  color: #667eea;
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
