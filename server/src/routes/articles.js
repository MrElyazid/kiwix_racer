import express from "express";
import {
  getArticleContent,
  getArticleMetadata,
  searchArticles,
  getRandomArticle,
  getArticleList,
  getArticleByPath,
} from "../controllers/articlesController.js";

const router = express.Router();

// Get article list with pagination and search
router.get("/", getArticleList);

// Get random article
router.get("/random", getRandomArticle);

// Search articles
router.get("/search", searchArticles);

// Get article metadata
router.get("/:title/metadata", getArticleMetadata);

// Get article content by title
router.get("/:title/content", getArticleContent);

export default router;
