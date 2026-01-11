<template>
  <div class="container">
    <div class="content-wrapper">
      <h1 class="title is-1 has-text-centered mb-6 page-title">
        Singleplayer configuration
      </h1>

      <!-- Language Selector -->
      <div class="language-selector-container">
        <p class="language-label">Wikipedia Language</p>
        <div class="language-selector">
          <button class="language-btn" @click="setLanguage('en')" :class="{ active: currentLanguage === 'en' }">
            English
          </button>
          <button class="language-btn" @click="setLanguage('fr')" :class="{ active: currentLanguage === 'fr' }">
            Français
          </button>
        </div>
      </div>

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
import { useLanguageStore } from "@/stores/language";
import { storeToRefs } from "pinia";

const languageStore = useLanguageStore();
const { currentLanguage } = storeToRefs(languageStore);

function setLanguage(lang) {
  languageStore.setLanguage(lang);
}

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
  background: var(--color-white);
  border: 3px solid var(--color-primary);
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.1);
  position: relative;
}

.page-title {
  font-family: 'Bagel Fat One', cursive;
  color: #2ec4b6;
  font-size: 2.5rem;
  margin-bottom: 1.5rem !important;
  text-align: center;
  width: 100%;
}

/* Language Selector */
.language-selector-container {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.language-label {
  font-family: 'Chewy', cursive;
  font-size: 1.125rem;
  font-weight: 400;
  color: var(--color-teal);
  margin-bottom: 0.5rem;
}

.language-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.language-btn {
  background: var(--color-white);
  border: 3px solid var(--color-teal);
  padding: 0.5rem 1rem;
  font-family: 'Chewy', cursive;
  font-size: 1.125rem;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
  font-weight: 400;
}

.language-btn:hover {
  text-decoration: underline;
}

.language-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.15);
}

.language-btn.active {
  border-color: var(--color-teal);
  background: var(--color-teal);
  color: var(--color-white);
}

.setup-box {
  background: var(--color-teal-light);
  padding: 1.5rem;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
  border: 2px solid var(--color-teal);
}

.setup-title {
  font-family: 'Bagel Fat One', cursive;
  color: var(--color-primary);
  font-size: 1.75rem;
  margin-bottom: 1.25rem;
}

.field {
  margin-bottom: 1.25rem;
}

.form-label {
  font-family: 'Chewy', cursive;
  color: #333;
  font-weight: 400;
  font-size: 1rem;
  margin-bottom: 0.375rem;
  display: block;
}

.control .input {
  border: 3px solid #2ec4b6;
  background: var(--color-white);
  color: #1e293b;
  font-family: 'Google Sans Code', 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 400;
  padding: 0.75rem 0.875rem;
  height: auto;
  transition: border-color 0.15s ease;
}

.control .input:hover {
  border-color: #2ec4b6;
}

.control .input:focus {
  border-color: #ff9f1c;
  background: var(--color-white);
  box-shadow: none;
  outline: none;
}

.control .input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.suggestions-box {
  border: 3px solid var(--color-teal);
  margin-top: 0.375rem;
  max-height: 180px;
  overflow-y: auto;
  background: var(--color-white);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
}

.suggestion-item {
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  border-bottom: 2px solid var(--color-teal-light);
  color: #333;
  font-family: 'DynaPuff', cursive;
  font-weight: 500;
  font-size: 0.9rem;
  transition: background-color 0.15s ease;
  display: flex;
  align-items: center;
}

.suggestion-item:hover {
  background: var(--color-teal-light);
  color: #000;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item::before {
  content: '';
  margin-right: 0;
  font-size: 0;
}

.button.is-info {
  background: #10b981;
  border: 3px solid #10b981;
  color: var(--color-white);
  font-family: 'Chewy', cursive;
  font-weight: 400;
  padding: 0.5rem 1rem;
  transition: all 0.15s ease;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);
  font-size: 1rem;
  margin-top: 0.375rem;
}

.button.is-info:hover:not(:disabled) {
  text-decoration: underline;
}

.button.is-info:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.button.is-info:disabled {
  background: #cbd5e1;
  border-color: #94a3b8;
  color: #64748b;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.button.is-primary.is-large {
  background: var(--color-primary);
  border: 3px solid var(--color-primary);
  color: var(--color-white);
  font-family: 'Chewy', cursive;
  font-weight: 400;
  font-size: 1.25rem;
  padding: 0.875rem 1.75rem;
  transition: all 0.15s ease;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  width: 100%;
}

.button.is-primary.is-large::before {
  display: none;
}

.button.is-primary.is-large:hover:not(:disabled) {
  text-decoration: underline;
}

.button.is-primary.is-large:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.button.is-primary.is-large:disabled {
  background: #cbd5e1;
  border-color: #94a3b8;
  color: #64748b;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.notification.is-danger {
  background: #ff6b6b;
  border: 3px solid #dc2626;
  color: var(--color-white);
  font-family: 'DynaPuff', cursive;
  font-weight: 600;
  padding: 0.75rem 1rem;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
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
    margin: 0 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .setup-box {
    padding: 1.25rem;
  }
  
  .button.is-primary.is-large {
    font-size: 1.125rem;
    padding: 0.75rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .setup-title {
    font-size: 1.5rem;
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