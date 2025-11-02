/**
 * Articles Controller
 * Handles requests related to Wikipedia articles
 */

import zimService from "../services/zimService.js";

/**
 * Get list of articles with pagination and search
 */
export const getArticleList = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";
    const archive = req.query.archive || "default";

    const result = zimService.getArticleList({
      limit,
      offset,
      search,
      archiveName: archive,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get article content by path from ZIM file
 */
export const getArticleByPath = async (req, res) => {
  try {
    let articlePath = req.url.substring(1);

    if (!articlePath) {
      return res.status(400).send("Article path required");
    }

    articlePath = decodeURIComponent(articlePath);
    const archive = req.query.archive || "default";

    const article = zimService.getArticleByPath(articlePath, archive);

    res.setHeader("Content-Type", article.mimetype);
    res.send(article.content);
  } catch (error) {
    if (error.message === "Article not found") {
      res.status(404).send("Article not found");
    } else {
      res.status(500).send("Error fetching article");
    }
  }
};

/**
 * Get article content from ZIM file by title
 */
export const getArticleContent = async (req, res) => {
  try {
    const { title } = req.params;
    const archive = req.query.archive || "default";

    const article = zimService.getArticleByTitle(title, archive);

    res.json({
      title: article.title,
      path: article.path,
      content: article.content,
      size: article.size,
    });
  } catch (error) {
    if (error.message === "Article not found") {
      res.status(404).json({ error: "Article not found" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

/**
 * Get article metadata from SQLite database
 */
export const getArticleMetadata = async (req, res) => {
  try {
    const { title } = req.params;

    // TODO: Query SQLite database for article metadata and links

    res.json({
      title,
      links: [],
      metadata: {},
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Search for articles
 */
export const searchArticles = async (req, res) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;
    const archive = req.query.archive || "default";

    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const result = zimService.getArticleList({
      limit: parseInt(limit),
      offset: parseInt(offset),
      search: q,
      archiveName: archive,
    });

    res.json({
      query: q,
      results: result.articles,
      count: result.count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a random article
 */
export const getRandomArticle = async (req, res) => {
  try {
    const archive = req.query.archive || "default";

    const article = zimService.getRandomArticle(archive);

    res.json({
      title: article.title,
      path: article.path,
      url: `/api/article/${encodeURIComponent(article.path)}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
