<template>
  <div class="container">
    <div class="content-wrapper">
      <h1 class="title is-1 has-text-centered mb-6 page-title">
        Wikipedia Racer
      </h1>

      <!-- Game Setup -->
      <div class="game-setup">
        <div class="box setup-box">
          <h2 class="title is-3 setup-title">Game Configuration</h2>

          <div class="field">
            <label class="label form-label">Starting Article</label>
            <div class="control">
              <input
                :value="startArticle"
                class="input"
                type="text"
                placeholder="Enter article name or click Random"
                @input="$emit('update:startArticle', $event.target.value)"
              />
            </div>
            <div v-if="startSuggestions.length > 0" class="suggestions-box">
              <div
                v-for="suggestion in startSuggestions"
                :key="suggestion.path"
                class="suggestion-item"
                @click="$emit('select-start-article', suggestion)"
              >
                {{ suggestion.title }}
              </div>
            </div>
            <button
              class="button is-small is-info mt-2"
              @click="$emit('get-random-start')"
              :disabled="loadingStart"
            >
              {{ loadingStart ? "Loading..." : "Random Start" }}
            </button>
          </div>

          <div class="field">
            <label class="label form-label">Target Article</label>
            <div class="control">
              <input
                :value="targetArticle"
                class="input"
                type="text"
                placeholder="Enter article name or click Random"
                @input="$emit('update:targetArticle', $event.target.value)"
              />
            </div>
            <div v-if="targetSuggestions.length > 0" class="suggestions-box">
              <div
                v-for="suggestion in targetSuggestions"
                :key="suggestion.path"
                class="suggestion-item"
                @click="$emit('select-target-article', suggestion)"
              >
                {{ suggestion.title }}
              </div>
            </div>
            <button
              class="button is-small is-info mt-2"
              @click="$emit('get-random-target')"
              :disabled="loadingTarget"
            >
              {{ loadingTarget ? "Loading..." : "Random Target" }}
            </button>
          </div>

          <div class="field">
            <label class="label form-label">Time Limit (minutes)</label>
            <div class="control">
              <input
                :value="timeLimit"
                class="input"
                type="number"
                min="1"
                max="60"
                placeholder="Enter time limit"
                @input="$emit('update:timeLimit', Number($event.target.value))"
              />
            </div>
          </div>

          <div class="field mt-5">
            <div class="control">
              <button
                class="button is-primary is-large is-fullwidth"
                @click="$emit('start-game')"
                :disabled="!canStartGame"
              >
                Start Game
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="notification is-danger mt-3">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  startArticle: String,
  targetArticle: String,
  timeLimit: Number,
  startSuggestions: Array,
  targetSuggestions: Array,
  loadingStart: Boolean,
  loadingTarget: Boolean,
  canStartGame: Boolean,
  errorMessage: String,
});

defineEmits([
  "update:startArticle",
  "update:targetArticle",
  "update:timeLimit",
  "select-start-article",
  "select-target-article",
  "get-random-start",
  "get-random-target",
  "start-game",
]);
</script>

<<style scoped>
.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(102, 126, 234, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}

.content-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px 16px 0 0;
}

.page-title {
  color: #222;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin-bottom: 1.5rem !important;
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  display: inline-block;
  text-align: center;
  width: 100%;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.setup-box {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 
    0 6px 24px rgba(0, 0, 0, 0.03),
    0 1px 6px rgba(102, 126, 234, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.setup-title {
  color: #667eea;
  font-weight: 600;
  font-size: 1.5rem;
  margin-bottom: 1.25rem;
  letter-spacing: -0.2px;
}

.field {
  margin-bottom: 1.25rem;
}

.form-label {
  color: #475569;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.375rem;
  display: block;
  letter-spacing: 0.1px;
}

.control .input {
  border: 1.5px solid rgba(203, 213, 224, 0.5);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  color: #1e293b;
  font-size: 0.95rem;
  padding: 0.75rem 0.875rem;
  height: auto;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.02),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
}

.control .input:hover {
  border-color: rgba(102, 126, 234, 0.4);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
}

.control .input:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 1);
  box-shadow: 
    0 4px 16px rgba(102, 126, 234, 0.12),
    0 0 0 2px rgba(102, 126, 234, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
  outline: none;
  transform: translateY(-1px);
}

.control .input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.suggestions-box {
  border: 1.5px solid rgba(102, 126, 234, 0.15);
  border-radius: 8px;
  margin-top: 0.375rem;
  max-height: 180px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.suggestion-item {
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(226, 232, 240, 0.5);
  color: #475569;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
}

.suggestion-item:hover {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: #667eea;
  transform: translateX(1px);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item::before {
  content: '🔗';
  margin-right: 0.375rem;
  font-size: 0.8rem;
  opacity: 0.6;
}

.suggestion-item:hover::before {
  opacity: 1;
  transform: scale(1.1);
}

.button.is-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  padding: 0.375rem 1rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 2px 8px rgba(102, 126, 234, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  font-size: 0.85rem;
  margin-top: 0.375rem;
}

.button.is-info:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.button.is-info:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 
    0 1px 4px rgba(102, 126, 234, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.button.is-info:disabled {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  color: #64748b;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.button.is-primary.is-large {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.875rem 1.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 6px 16px rgba(102, 126, 234, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  position: relative;
  overflow: hidden;
  width: 100%;
}

.button.is-primary.is-large::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.button.is-primary.is-large:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(102, 126, 234, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.button.is-primary.is-large:hover::before {
  left: 100%;
}

.button.is-primary.is-large:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 
    0 3px 10px rgba(102, 126, 234, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.button.is-primary.is-large:disabled {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  color: #64748b;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.notification.is-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  padding: 0.75rem 1rem;
  box-shadow: 0 3px 8px rgba(255, 107, 107, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 0.875rem;
  font-size: 0.9rem;
}

/* Animations d'entrée */
.content-wrapper {
  animation: fadeInUp 0.5s ease-out;
}

.setup-box {
  animation: fadeIn 0.6s ease-out 0.15s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 1.25rem;
    border-radius: 14px;
    margin: 0 1rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .setup-box {
    padding: 1.25rem;
  }
  
  .button.is-primary.is-large {
    font-size: 0.95rem;
    padding: 0.75rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 1rem;
    border-radius: 12px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .setup-title {
    font-size: 1.25rem;
  }
  
  .setup-box {
    padding: 1rem;
  }
  
  .control .input {
    padding: 0.625rem 0.75rem;
    font-size: 0.9rem;
  }
}
</style>