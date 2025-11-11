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

<style scoped>
.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.page-title {
  color: #222;
}

.setup-box {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #667eea;
}

.setup-title {
  color: #667eea;
  font-weight: 700;
}

.form-label {
  color: #2a2a2a;
  font-weight: 600;
}

.field .input {
  border-color: #667eea;
  background-color: white;
  color: #1a1a1a;
}

.field .input:focus {
  border-color: #764ba2;
  box-shadow: 0 0 0 0.125em rgba(102, 126, 234, 0.25);
}

.field .input::placeholder {
  color: #999;
}

.suggestions-box {
  border: 1px solid #667eea;
  border-radius: 4px;
  margin-top: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  color: #1a1a1a;
  font-weight: 500;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.suggestion-item:last-child {
  border-bottom: none;
}
</style>
