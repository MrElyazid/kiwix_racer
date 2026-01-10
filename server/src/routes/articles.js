import express from "express";
import { getRandomArticle, getArticleByTitle } from "../controllers/articlesController.js";

const router = express.Router();

// Get a random article
router.get("/random", getRandomArticle);

// Get article by title
router.get("/:title", getArticleByTitle);

export default router;
