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
          <router-link to="/" class="navbar-item">
            <strong>Kiwix Racer</strong>
          </router-link>
        </div>

        <div class="navbar-menu">
          <div class="navbar-end">
            <router-link to="/" class="navbar-item">Home</router-link>
            <router-link to="/singleplayer" class="navbar-item"
              >Singleplayer</router-link
            >
            <router-link to="/explore" class="navbar-item">Explore</router-link>
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
import { ref } from "vue";
import { RouterView } from "vue-router";

const hideNavbar = ref(false);
</script>

<style>
#app {
  min-height: 100vh;
}

.navbar.is-transparent {
  background-color: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px);
  border-bottom: 2px solid #c2e2fa;
}

.navbar-item {
  font-size: 1.1rem;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto,
    sans-serif;
}

.navbar-brand .navbar-item strong {
  font-size: 1.3rem;
  font-weight: 800;
}

.navbar-item:hover {
  background-color: rgba(255, 143, 143, 0.1) !important;
}

.is-fullheight-with-navbar {
  min-height: calc(100vh - 52px);
}
</style>
