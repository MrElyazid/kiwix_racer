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
            <img :src="logo" alt="WikiDash Logo" class="logo-img" />
            <strong>WikiDash</strong>
          </router-link>
        </div>
        <div class="navbar-menu">
          <div class="navbar-end">
            <router-link to="/" class="navbar-item">Home</router-link>
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
import logo from "@/assets/logo.png";

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
  background-color: var(--color-white) !important;
  backdrop-filter: blur(10px);
  border-bottom: 3px solid #2ec4b6;
  padding: 0.5rem 0;
  box-shadow: none;
}

.navbar-item {
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Chewy', cursive;
  color: #2ec4b6;
  border-radius: 0;
  margin: 0 0.25rem;
  transition: none;
}

.navbar-item:hover {
  text-decoration: underline;
  background-color: transparent !important;
}

.navbar-brand .navbar-item strong {
  font-family: 'Bagel Fat One', cursive;
  font-size: 1.8rem;
  font-weight: 400;
  color: #2ec4b6;
  letter-spacing: 1px;
}

.logo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-img {
  max-height: 32px;
  width: auto;
  transition: transform 0.3s ease;
}

.navbar-item:hover .logo-img {
  transform: rotate(-10deg);
}

.navbar-item:hover, .navbar-item.router-link-active {
  background-color: rgba(255, 143, 143, 0.15) !important;
  color: #e04a4a !important;
}

.navbar-item.logo-item:hover {
  background-color: transparent !important;
  color: #2c3e50 !important;
}

.is-fullheight-with-navbar {
  min-height: calc(100vh - 52px);
}
</style>
