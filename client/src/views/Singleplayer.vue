<template>
  <div class="singleplayer">
    <P5Background />

    <div class="container">
      <div class="content-wrapper">
        <h1 class="title is-1 has-text-centered mb-6 page-title">
          Singleplayer Mode
        </h1>

        <!-- Game Setup -->
        <div v-if="!gameStarted" class="game-setup">
          <div class="box setup-box">
            <h2 class="title is-3 setup-title">Game Configuration</h2>

            <div class="field">
              <label class="label form-label">Starting Article</label>
              <div class="control">
                <input
                  v-model="startArticle"
                  class="input"
                  type="text"
                  placeholder="Enter article name or click Random"
                  @input="searchStartArticles"
                />
              </div>
              <div v-if="startSuggestions.length > 0" class="suggestions-box">
                <div
                  v-for="suggestion in startSuggestions"
                  :key="suggestion.path"
                  class="suggestion-item"
                  @click="selectStartArticle(suggestion)"
                >
                  {{ suggestion.title }}
                </div>
              </div>
              <button
                class="button is-small is-info mt-2"
                @click="getRandomStart"
                :disabled="loadingStart"
              >
                {{ loadingStart ? "Loading..." : "Random Start" }}
              </button>
            </div>

            <div class="field">
              <label class="label form-label">Target Article</label>
              <div class="control">
                <input
                  v-model="targetArticle"
                  class="input"
                  type="text"
                  placeholder="Enter article name or click Random"
                  @input="searchTargetArticles"
                />
              </div>
              <div v-if="targetSuggestions.length > 0" class="suggestions-box">
                <div
                  v-for="suggestion in targetSuggestions"
                  :key="suggestion.path"
                  class="suggestion-item"
                  @click="selectTargetArticle(suggestion)"
                >
                  {{ suggestion.title }}
                </div>
              </div>
              <button
                class="button is-small is-info mt-2"
                @click="getRandomTarget"
                :disabled="loadingTarget"
              >
                {{ loadingTarget ? "Loading..." : "Random Target" }}
              </button>
            </div>

            <div class="field">
              <label class="label form-label">Time Limit (minutes)</label>
              <div class="control">
                <input
                  v-model.number="timeLimit"
                  class="input"
                  type="number"
                  min="1"
                  max="60"
                  placeholder="Enter time limit"
                />
              </div>
            </div>

            <div class="field mt-5">
              <div class="control">
                <button
                  class="button is-primary is-large is-fullwidth"
                  @click="startGame"
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

        <!-- Game In Progress -->
        <div v-else class="game-play">
          <div class="game-info box">
            <div class="columns">
              <div class="column">
                <p><strong>Start:</strong> {{ startArticle }}</p>
              </div>
              <div class="column has-text-centered">
                <p class="timer">
                  <strong>Time:</strong> {{ formattedTime }}
                </p>
              </div>
              <div class="column has-text-right">
                <p><strong>Target:</strong> {{ targetArticle }}</p>
              </div>
            </div>
            <div class="has-text-centered mt-3">
              <p><strong>Clicks:</strong> {{ clickCount }}</p>
            </div>
          </div>

          <!-- Article Viewer -->
          <div class="box article-box">
            <div class="article-header">
              <h2 class="title is-4">{{ currentArticleTitle }}</h2>
              <button class="button is-danger" @click="endGame">
                End Game
              </button>
            </div>

            <div
              class="article-content"
              v-html="currentArticleContent"
              @click="handleArticleClick"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import P5Background from "../components/P5Background.vue";

const API_URL = "http://localhost:3000/api";

const gameStarted = ref(false);
const startArticle = ref("");
const targetArticle = ref("");
const timeLimit = ref(10);
const errorMessage = ref("");

const startArticlePath = ref("");
const targetArticlePath = ref("");

const startSuggestions = ref([]);
const targetSuggestions = ref([]);
const loadingStart = ref(false);
const loadingTarget = ref(false);

const currentArticleTitle = ref("");
const currentArticleContent = ref("");
const clickCount = ref(0);
const timeRemaining = ref(0);
let gameTimer = null;

let searchTimeout = null;

const canStartGame = computed(() => {
  return (
    startArticle.value.trim() !== "" &&
    targetArticle.value.trim() !== "" &&
    timeLimit.value > 0
  );
});

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60);
  const seconds = timeRemaining.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

async function searchStartArticles() {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (startArticle.value.length < 2) {
    startSuggestions.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const response = await axios.get(`${API_URL}/articles/search`, {
        params: { q: startArticle.value, limit: 5 },
      });
      startSuggestions.value = response.data.results;
    } catch (error) {
      console.error("Error searching articles:", error);
    }
  }, 300);
}

async function searchTargetArticles() {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (targetArticle.value.length < 2) {
    targetSuggestions.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const response = await axios.get(`${API_URL}/articles/search`, {
        params: { q: targetArticle.value, limit: 5 },
      });
      targetSuggestions.value = response.data.results;
    } catch (error) {
      console.error("Error searching articles:", error);
    }
  }, 300);
}

function selectStartArticle(article) {
  startArticle.value = article.title;
  startArticlePath.value = article.path;
  startSuggestions.value = [];
}

function selectTargetArticle(article) {
  targetArticle.value = article.title;
  targetArticlePath.value = article.path;
  targetSuggestions.value = [];
}

async function getRandomStart() {
  loadingStart.value = true;
  try {
    const response = await axios.get(`${API_URL}/articles/random`);
    startArticle.value = response.data.title;
    startArticlePath.value = response.data.path;
    startSuggestions.value = [];
  } catch (error) {
    errorMessage.value = "Failed to get random article";
  } finally {
    loadingStart.value = false;
  }
}

async function getRandomTarget() {
  loadingTarget.value = true;
  try {
    const response = await axios.get(`${API_URL}/articles/random`);
    targetArticle.value = response.data.title;
    targetArticlePath.value = response.data.path;
    targetSuggestions.value = [];
  } catch (error) {
    errorMessage.value = "Failed to get random article";
  } finally {
    loadingTarget.value = false;
  }
}

async function startGame() {
  if (!canStartGame.value) return;

  errorMessage.value = "";

  try {
    gameStarted.value = true;
    timeRemaining.value = timeLimit.value * 60;
    clickCount.value = 0;

    gameTimer = setInterval(() => {
      timeRemaining.value--;
      if (timeRemaining.value <= 0) {
        endGame(true);
      }
    }, 1000);

    await loadArticle(startArticlePath.value || startArticle.value);
  } catch (error) {
    errorMessage.value = "Failed to start game";
    gameStarted.value = false;
  }
}

async function loadArticle(path) {
  try {
    const response = await axios.get(`${API_URL}/article/${path}`, {
      responseType: "text",
    });

    currentArticleTitle.value = path.replace(/_/g, " ");
    currentArticleContent.value = response.data;

    if (currentArticleTitle.value === targetArticle.value) {
      endGame(false, true);
    }
  } catch (error) {
    console.error("Error loading article:", error);
    errorMessage.value = "Failed to load article";
  }
}

function handleArticleClick(event) {
  const target = event.target;

  if (target.tagName === "A" && target.href) {
    event.preventDefault();

    const href = target.getAttribute("href");

    if (href && !href.startsWith("http") && !href.startsWith("#")) {
      const path = href.replace(/^\.\//, "").split("#")[0];
      if (path) {
        clickCount.value++;
        loadArticle(path);
      }
    }
  }
}

function endGame(timeUp = false, won = false) {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }

  if (won) {
    alert(
      `Congratulations! You reached the target in ${clickCount.value} clicks!`
    );
  } else if (timeUp) {
    alert("Time's up! Game over.");
  }

  gameStarted.value = false;
  startArticle.value = "";
  targetArticle.value = "";
  timeLimit.value = 10;
  currentArticleContent.value = "";
  currentArticleTitle.value = "";
  clickCount.value = 0;
}
</script>

<style scoped>
.singleplayer {
  min-height: 100vh;
  position: relative;
  padding: 2rem 0;
}

.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.page-title {
  color: #222;
}

.setup-box {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #C2E2FA;
}

.setup-title {
  color: #1a1a1a;
}

.form-label {
  color: #2a2a2a;
  font-weight: 600;
}

.suggestions-box {
  border: 1px solid #dbdbdb;
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
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.game-info {
  margin-bottom: 1rem;
}

.timer {
  font-size: 1.5rem;
  color: #3273dc;
}

.article-box {
  background: white;
  min-height: 500px;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f5f5f5;
}

.article-header .title {
  color: #1a1a1a;
}

.article-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 1rem;
  color: #2a2a2a;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3),
.article-content :deep(h4),
.article-content :deep(h5),
.article-content :deep(h6) {
  color: #1a1a1a;
}

.article-content :deep(p) {
  color: #2a2a2a;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
