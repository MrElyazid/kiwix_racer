import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/singleplayer",
      name: "singleplayer",
      component: () => import("../views/Singleplayer.vue"),
    },
    {
      path: "/explore",
      name: "explore",
      component: () => import("../views/Explore.vue"),
    },
    {
      path: "/multiplayer",
      name: "multiplayer",
      component: () => import("../views/Multiplayer.vue"),
    },
  ],
});

export default router;
