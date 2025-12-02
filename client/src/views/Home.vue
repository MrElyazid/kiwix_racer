<template>
  <div class="home">
    <P5Background />

    <section class="hero is-fullheight-with-navbar">
      <div class="hero-body">
        <div class="container has-text-centered">
          <div class="language-selector">
            <button class="language-btn" @click="setLanguage('en')" :class="{ active: currentLanguage === 'en' }">
              🇬🇧
            </button>
            <button class="language-btn" @click="setLanguage('fr')" :class="{ active: currentLanguage === 'fr' }">
              🇫🇷
            </button>
          </div>
          
          <h1 class="title is-1 main-title">Kiwix Racer</h1>
          <p class="subtitle is-4 subtitle-text">
            Navigate from one Wikipedia article to another in the quickest way
            possible
          </p>

          <div class="columns is-centered mt-6">
            <div class="column is-4">
              <div class="card game-card">
                <div class="card-content">
                  <p class="title is-4 card-title">🎮 Singleplayer</p>
                  <p class="content card-text">
                    Choose starting and target articles, then race to find the
                    path between them
                  </p>
                  <router-link to="/singleplayer" class="button is-primary is-fullwidth">
                    Start Game
                  </router-link>
                </div>
              </div>
            </div>

            <div class="column is-4">
              <div class="card game-card">
                <div class="card-content">
                  <p class="title is-4 card-title">🌐 Multiplayer</p>
                  <p class="content card-text">
                    Race against other players in real-time Wiki navigation
                    challenges
                  </p>
                  <button class="button is-fullwidth" disabled>
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            <div class="column is-4">
              <div class="card game-card">
                <div class="card-content">
                  <p class="title is-4 card-title">🔍 Explore</p>
                  <p class="content card-text">
                    Browse Wikipedia datasets and visualize graph traversal
                    algorithms
                  </p>
                  <router-link to="/explore" class="button is-info is-fullwidth">
                    Explore
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import P5Background from "../components/P5Background.vue";
import { useLanguageStore } from "@/stores/language";
import { storeToRefs } from "pinia";

const languageStore = useLanguageStore();
const { currentLanguage } = storeToRefs(languageStore);

function setLanguage(lang) {
  languageStore.setLanguage(lang);
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  position: relative;
}

.main-title {
  font-size: 4rem;
  font-weight: 900;
  color: #222;
  letter-spacing: 2px;
}

.subtitle-text {
  color: #333;
}

.game-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  border: 2px solid #C2E2FA;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: #FF8F8F;
}

.card-content .title {
  margin-bottom: 1rem;
}

.card-title {
  color: #1a1a1a;
}

.card-text {
  color: #2a2a2a;
}

.card-content .content {
  min-height: 60px;
  margin-bottom: 1.5rem;
}

.button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Language Selector */
.language-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.language-btn {
  background: white;
  border: 2px solid #C2E2FA;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.language-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #FF8F8F;
}

.language-btn.active {
  border-color: #FF8F8F;
  border-width: 3px;
  box-shadow: 0 4px 16px rgba(255, 143, 143, 0.3);
}
</style>
