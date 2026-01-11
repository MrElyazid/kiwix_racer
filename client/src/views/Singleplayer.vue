<template>
  <div class="singleplayer" :class="{ 'game-active': gameStarted }">
    <P5Background />

    <!-- Fixed Game Info Bar (only visible during game) -->
    <GameInfoBar
      v-if="gameStarted"
      :start-article="startArticle"
      :target-article="targetArticle"
      :click-count="clickCount"
      :formatted-time="formattedTime"
      :can-go-back="canGoBack"
      :can-go-forward="canGoForward"
      :search-query="searchQuery"
      :search-matches="searchMatches"
      @go-back="goBack"
      @go-forward="goForward"
      @end-game="endGame"
      @update:search-query="handleSearchInput"
      @clear-search="clearSearch"
      @select-first-result="selectFirstSearchResult"
    />

    <!-- Game Setup -->
    <GameSetup
      v-if="!gameStarted"
      v-model:start-article="startArticle"
      v-model:target-article="targetArticle"
      v-model:time-limit="timeLimit"
      :start-suggestions="startSuggestions"
      :target-suggestions="targetSuggestions"
      :loading-start="loadingStart"
      :loading-target="loadingTarget"
      :can-start-game="canStartGame"
      :error-message="errorMessage"
      @update:start-article="searchStartArticles"
      @update:target-article="searchTargetArticles"
      @select-start-article="selectStartArticle"
      @select-target-article="selectTargetArticle"
      @get-random-start="getRandomStart"
      @get-random-target="getRandomTarget"
      @start-game="startGame"
    />

    <!-- Game In Progress - Full Screen Article -->
    <div v-if="gameStarted" class="game-wrapper">
      <ArticleViewer
        ref="articleViewerRef"
        :current-article-title="currentArticleTitle"
        :current-article-content="currentArticleContent"
        :loading-article="loadingArticle"
        @article-click="handleArticleClick"
      />
    </div>

    <!-- Game Notification Modal -->
    <GameNotification
      :show="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      :stats="notification.stats"
      :show-play-again="notification.showPlayAgain"
      @close="closeNotification"
      @play-again="playAgain"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount, onMounted } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import axios from "axios";
import { useLanguageStore } from "@/stores/language";
import { storeToRefs } from "pinia";
import P5Background from "../components/P5Background.vue";
import GameInfoBar from "../components/singleplayer/GameInfoBar.vue";
import GameSetup from "../components/singleplayer/GameSetup.vue";
import ArticleViewer from "../components/singleplayer/ArticleViewer.vue";
import GameNotification from "../components/singleplayer/GameNotification.vue";
import { useFuzzyLinkSearch } from "@/composables/useFuzzyLinkSearch";

const emit = defineEmits(["game-started", "game-ended"]);
const router = useRouter();

// Get language from store
const languageStore = useLanguageStore();
const { currentLanguage } = storeToRefs(languageStore);

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
const currentArticlePath = ref("");
const clickCount = ref(0);
const timeRemaining = ref(0);
const loadingArticle = ref(false);

// Navigation history
const navigationHistory = ref([]);
const currentHistoryIndex = ref(-1);

// Fuzzy link search
const linkSearch = useFuzzyLinkSearch();
const searchQuery = ref("");
const searchMatches = computed(() => linkSearch.searchResults.value.length);

// Article viewer reference
const articleViewerRef = ref(null);

// Notification state
const notification = ref({
  show: false,
  type: "info",
  title: "",
  message: "",
  stats: null,
  showPlayAgain: false,
});

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

const elapsedTime = computed(() => {
  const totalSeconds = (timeLimit.value * 60) - timeRemaining.value;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

const canGoBack = computed(() => {
  return currentHistoryIndex.value > 0;
});

const canGoForward = computed(() => {
  return currentHistoryIndex.value < navigationHistory.value.length - 1;
});

async function searchStartArticles() {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (startArticle.value.length < 2) {
    startSuggestions.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      loadingStart.value = true;
      const wikiLang = currentLanguage.value === 'fr' ? 'fr' : 'en';
      const response = await axios.get(`https://${wikiLang}.wikipedia.org/w/api.php`, {
        params: {
          action: "opensearch",
          search: startArticle.value,
          limit: 5,
          namespace: 0,
          format: "json",
          origin: "*",
        },
      });
      const titles = response.data[1] || [];
      startSuggestions.value = titles.map((title) => ({
        title,
        path: title.replace(/ /g, "_"),
      }));
    } catch (error) {
      console.error("Error searching articles:", error);
    } finally {
      loadingStart.value = false;
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
      loadingTarget.value = true;
      const wikiLang = currentLanguage.value === 'fr' ? 'fr' : 'en';
      const response = await axios.get(`https://${wikiLang}.wikipedia.org/w/api.php`, {
        params: {
          action: "opensearch",
          search: targetArticle.value,
          limit: 5,
          namespace: 0,
          format: "json",
          origin: "*",
        },
      });
      const titles = response.data[1] || [];
      targetSuggestions.value = titles.map((title) => ({
        title,
        path: title.replace(/ /g, "_"),
      }));
    } catch (error) {
      console.error("Error searching articles:", error);
    } finally {
      loadingTarget.value = false;
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
    const wikiLang = currentLanguage.value === 'fr' ? 'fr' : 'en';
    const response = await axios.get(`https://${wikiLang}.wikipedia.org/w/api.php`, {
      params: {
        action: "query",
        list: "random",
        rnnamespace: 0,
        rnlimit: 1,
        format: "json",
        origin: "*",
      },
    });
    const randomPage = response.data.query.random[0];
    startArticle.value = randomPage.title;
    startArticlePath.value = randomPage.title.replace(/ /g, "_");
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
    const wikiLang = currentLanguage.value === 'fr' ? 'fr' : 'en';
    const response = await axios.get(`https://${wikiLang}.wikipedia.org/w/api.php`, {
      params: {
        action: "query",
        list: "random",
        rnnamespace: 0,
        rnlimit: 1,
        format: "json",
        origin: "*",
      },
    });
    const randomPage = response.data.query.random[0];
    targetArticle.value = randomPage.title;
    targetArticlePath.value = randomPage.title.replace(/ /g, "_");
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
    emit("game-started");
    timeRemaining.value = timeLimit.value * 60;
    clickCount.value = 0;

    navigationHistory.value = [];
    currentHistoryIndex.value = -1;

    gameTimer = setInterval(() => {
      timeRemaining.value--;
      if (timeRemaining.value <= 0) {
        endGame(true);
      }
    }, 1000);

    await loadArticle(startArticlePath.value || startArticle.value, true);
  } catch (error) {
    errorMessage.value = "Failed to start game";
    gameStarted.value = false;
    emit("game-ended");
  }
}

async function loadArticle(path, isInitialLoad = false) {
  loadingArticle.value = true;
  try {
    // Store current article path
    currentArticlePath.value = path;

    const articleName = path.replace(/ /g, "_");
    
    // Use the backend API with language parameter
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/article/${encodeURIComponent(articleName)}`,
      {
        params: {
          lang: currentLanguage.value
        }
      }
    );

    currentArticleTitle.value = path.replace(/_/g, " ");
    currentArticleContent.value = response.data;

    // Extract links for search
    linkSearch.extractAndCacheLinks(path, response.data);

    // Clear search on new article
    clearSearch();

    if (!isInitialLoad && gameStarted.value) {
      if (currentHistoryIndex.value < navigationHistory.value.length - 1) {
        navigationHistory.value = navigationHistory.value.slice(
          0,
          currentHistoryIndex.value + 1
        );
      }

      navigationHistory.value.push({
        path,
        title: currentArticleTitle.value,
        content: currentArticleContent.value,
      });
      currentHistoryIndex.value = navigationHistory.value.length - 1;
    } else if (isInitialLoad) {
      navigationHistory.value = [
        {
          path,
          title: currentArticleTitle.value,
          content: currentArticleContent.value,
        },
      ];
      currentHistoryIndex.value = 0;
    }

    if (currentArticleTitle.value === targetArticle.value) {
      endGame(false, true);
    }
  } catch (error) {
    console.error("Error loading article:", error);
    errorMessage.value = "Failed to load article";
  } finally {
    loadingArticle.value = false;
  }
}

function handleArticleClick(event) {
  const target = event.target;

  if (target.tagName === "IMG") {
    event.preventDefault();
    return;
  }

  const link = target.closest("a");
  if (link && link.href) {
    if (link.querySelector("img")) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    const href = link.getAttribute("href");

    if (href && (href.includes("wikipedia") || href.startsWith("http"))) {
      return;
    }

    if (href && !href.startsWith("#")) {
      let path;

      if (href.startsWith("./")) {
        path = decodeURIComponent(href.substring(2)).split("#")[0];
        if (path.includes(":")) return;
      } else {
        return;
      }

      if (path) {
        clickCount.value++;
        loadArticle(path);
      }
    }
  }
}

function goBack() {
  if (!canGoBack.value) return;

  currentHistoryIndex.value--;
  const historyItem = navigationHistory.value[currentHistoryIndex.value];

  currentArticleTitle.value = historyItem.title;
  currentArticleContent.value = historyItem.content;

  // Extract links and clear search
  linkSearch.extractAndCacheLinks(historyItem.path, historyItem.content);
  clearSearch();

  if (currentArticleTitle.value === targetArticle.value) {
    endGame(false, true);
  }
}

function goForward() {
  if (!canGoForward.value) return;

  currentHistoryIndex.value++;
  const historyItem = navigationHistory.value[currentHistoryIndex.value];

  currentArticleTitle.value = historyItem.title;
  currentArticleContent.value = historyItem.content;

  // Extract links and clear search
  linkSearch.extractAndCacheLinks(historyItem.path, historyItem.content);
  clearSearch();

  if (currentArticleTitle.value === targetArticle.value) {
    endGame(false, true);
  }
}

function handleSearchInput(value) {
  searchQuery.value = value;
  linkSearch.searchLinks(value, () => {
    // Highlight matches after search completes
    if (articleViewerRef.value?.$el) {
      const container = articleViewerRef.value.$el.querySelector('.article-content');
      linkSearch.highlightMatches(container);
    }
  });
}

function selectFirstSearchResult() {
  if (linkSearch.searchResults.value.length > 0) {
    const firstResult = linkSearch.searchResults.value[0];
    clickCount.value++;
    loadArticle(firstResult.path);
  }
}

function clearSearch() {
  searchQuery.value = "";
  linkSearch.clearSearch();
  // Remove highlights
  if (articleViewerRef.value?.$el) {
    const container = articleViewerRef.value.$el.querySelector('.article-content');
    linkSearch.removeHighlights(container);
  }
}

function endGame(timeUp = false, won = false) {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }

  if (won) {
    notification.value = {
      show: true,
      type: "success",
      title: "Congratulations!",
      message: `You reached the target article!`,
      stats: {
        clicks: clickCount.value,
        time: elapsedTime.value,
      },
      showPlayAgain: true,
    };
  } else if (timeUp) {
    notification.value = {
      show: true,
      type: "error",
      title: "Time's Up!",
      message: "You ran out of time. Better luck next time!",
      stats: {
        clicks: clickCount.value,
      },
      showPlayAgain: true,
    };
  } else {
    // Manual end game - redirect to home with full reload
    gameStarted.value = false;
    emit("game-ended");
    nextTick(() => {
      window.location.href = "/";
    });
  }

  // Don't reset game state immediately if showing notification - wait for notification to close
}

function closeNotification() {
  notification.value.show = false;

  // Redirect to home page after notification closes with full reload
  gameStarted.value = false;
  emit("game-ended");
  nextTick(() => {
    window.location.href = "/";
  });
}

function playAgain() {
  notification.value.show = false;

  // Reset game state and stay on singleplayer page
  gameStarted.value = false;
  emit("game-ended");
  startArticle.value = "";
  targetArticle.value = "";
  currentArticleContent.value = "";
  currentArticleTitle.value = "";
  currentArticlePath.value = "";
  clickCount.value = 0;
  timeRemaining.value = 0;
}

// Intercept navigation away from the page (including browser back button)
onBeforeRouteLeave((to, from, next) => {
  // If game is not active, allow navigation
  if (!gameStarted.value) {
    // Force full reload if going to home page
    if (to.path === "/") {
      window.location = window.location.origin + "/";
      return;
    } else {
      next();
    }
    return;
  }

  // If game is active, show confirmation
  const confirmed = window.confirm(
    "Are you sure you want to leave? Your game progress will be lost."
  );

  if (confirmed) {
    // Clean up the game timer before leaving
    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
    gameStarted.value = false;
    emit("game-ended");
    
    // Force full reload if going to home page
    if (to.path === "/") {
      window.location = window.location.origin + "/";
    } else {
      next();
    }
  } else {
    // Cancel navigation
    next(false);
  }
});

// Add beforeunload event to catch all page navigation attempts (including full page reloads)
const handleBeforeUnload = (e) => {
  if (gameStarted.value) {
    e.preventDefault();
    e.returnValue = ""; // Required for Chrome
    return ""; // For other browsers
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});

// Cleanup on component unmount
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
});
</script>

<style scoped>
.singleplayer {
  min-height: 100vh;
  position: relative;
}

.singleplayer:not(.game-active) {
  padding: 2rem 0;
}

.game-wrapper {
  position: fixed;
  top: 53px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}
</style>
