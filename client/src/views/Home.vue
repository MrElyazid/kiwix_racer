<template>
  <div class="home">
    <P5Background />

    <section class="hero is-fullheight-with-navbar">
      <div class="hero-body">
        <div class="container has-text-centered">
          <h1 class="title is-1 main-title">WikiDash</h1>
          <p class="subtitle is-4 subtitle-text">
            Navigate from one Wikipedia article to another in the quickest way
            possible
          </p>

          <div class="columns is-centered mt-6">
            <div class="column is-4">
              <div class="card game-card card-singleplayer">
                <div class="card-content">
                  <p class="title is-4 card-title">Singleplayer</p>
                  <p class="content card-text">
                    Choose starting and target articles, then race to find the
                    path between them
                  </p>
                  <router-link to="/singleplayer" class="button game-button is-fullwidth">
                    Start Game
                  </router-link>
                </div>
              </div>
            </div>

            <div class="column is-4">
              <div class="card game-card card-multiplayer">
                <div class="card-content">
                  <p class="title is-4 card-title">Multiplayer</p>
                  <p class="content card-text">
                    Race against other players in real-time Wiki navigation
                    challenges
                  </p>
                  <router-link to="/multiplayer" class="button game-button is-fullwidth">
                    Play Online
                  </router-link>
                </div>
              </div>
            </div>

            <div class="column is-4">
              <div class="card game-card card-explore">
                <div class="card-content">
                  <p class="title is-4 card-title">Explore</p>
                  <p class="content card-text">
                    Browse Wikipedia datasets and visualize graph traversal
                    algorithms
                  </p>
                  <router-link to="/explore" class="button game-button is-fullwidth">
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
</script>

<style scoped>
.home {
  min-height: 100vh;
  position: relative;
}

.main-title {
  font-size: 4rem;
  font-weight: 900;
  font-family: 'Bagel Fat One', cursive;
  color: #ff9f1c;
  letter-spacing: 2px;
}

.subtitle-text {
  color: #333;
  font-family: 'Google Sans Code', 'Courier New', monospace;
}

.game-card {
  background: white;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  border: 3px solid #2ec4b6;
}

.card-singleplayer {
  border-color: #10b981;
}

.card-multiplayer {
  border-color: #ff9f1c;
}

.card-explore {
  border-color: #ff6b6b;
}


.card-content .title {
  margin-bottom: 1rem;
}

.card-title {
  color: #2ec4b6;
  font-family: 'Chewy', cursive;
}

.card-text {
  color: #2a2a2a;
  font-family: 'Google Sans Code', 'Courier New', monospace;
}

.card-content .content {
  min-height: 60px;
  margin-bottom: 1.5rem;
}

.button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-button {
  background-color: #2ec4b6 !important;
  color: white !important;
  border: 3px solid #2ec4b6 !important;
  border-radius: 0 !important;
  font-family: 'Chewy', cursive !important;
  font-size: 1.1rem !important;
  padding: 0.75rem 1.5rem !important;
  transition: none !important;
}

.game-button:hover {
  text-decoration: underline;
  background-color: #2ec4b6 !important;
}
</style>
