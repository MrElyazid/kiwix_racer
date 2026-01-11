<template>
  <div id="app">
    <nav
      v-if="!hideNavbar"
      class="navbar is-transparent"
      role="navigation"
      aria-label="main navigation"
    >
      <div class="container">
        <div class="navbar-brand">
          <router-link to="/" class="navbar-item logo-item">
            <strong class="colorful-title">WikiDash</strong>
          </router-link>
        </div>
        <div class="navbar-menu">
          <div class="navbar-end">
            <router-link to="/" class="navbar-item nav-link-badge">Home</router-link>
            <a href="https://github.com/MrElyazid/wikiDash" target="_blank" rel="noopener noreferrer" class="navbar-item nav-link-badge github-link">
              <i class="fab fa-github"></i>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <RouterView
        @game-started="hideNavbar = true"
        @game-ended="hideNavbar = false"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import { useLanguageStore } from "@/stores/language";
import { storeToRefs } from "pinia";

const route = useRoute();
const hideNavbar = ref(false);

// Pinia language store
const languageStore = useLanguageStore();
const { currentLanguage } = storeToRefs(languageStore);

// Watch route changes to ensure navbar visibility is correct
watch(
  () => route.path,
  (newPath) => {
    // Reset navbar visibility when navigating away from game
    if (newPath === "/" || newPath === "/explore") {
      hideNavbar.value = false;
    }
  }
);
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Bagel+Fat+One&display=swap');

#app {
  min-height: 100vh;
}

.navbar.is-transparent {
  background: #FFFDE1 !important;
  backdrop-filter: blur(10px);
  border-bottom: 3px solid #2ec4b6;
  padding: 0.75rem 0;
  box-shadow: 0 2px 12px rgba(46, 196, 182, 0.2);
}

.navbar-item {
  font-family: 'Chewy', cursive;
  color: #1a1a1a;
  border-radius: 0;
  transition: all 0.3s ease;
}

.logo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
}

.logo-item:hover,
.logo-item:active,
.logo-item:focus,
.logo-item.router-link-active {
  background-color: transparent !important;
}

.colorful-title {
  font-family: 'Bagel Fat One', cursive;
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: 2px;
  color: #1a1a1a;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
}

.nav-link-badge {
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid #1a1a1a;
  padding: 0.5rem 1rem !important;
  margin: 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.nav-link-badge:hover {
  background-color: #ff9f1c !important;
  color: #1a1a1a !important;
  border-color: #1a1a1a;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
  transform: translate(1px, 1px);
}

.nav-link-badge.router-link-active {
  background-color: #2ec4b6 !important;
  color: #1a1a1a !important;
  border-color: #1a1a1a;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.github-link i {
  font-size: 1.1rem;
}

.is-fullheight-with-navbar {
  min-height: calc(100vh - 52px);
}
</style>
