/**
 * Articles Controller
 * Handles requests related to Wikipedia articles
 */

import wikipediaService from "../services/wikipediaService.js";

/**
 * Get article content by path from Wikipedia API
 */
export const getArticleByPath = async (req, res) => {
  try {
    // Use req.path to get the path without query parameters
    let articlePath = req.path.substring(1);

    if (!articlePath) {
      return res.status(400).send("Article path required");
    }

    articlePath = decodeURIComponent(articlePath);

    console.log(`Fetching article: ${articlePath} from Wikipedia API`);

    // Fetch from Wikipedia API
    const html = await wikipediaService.fetchArticleHtml(articlePath);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error(`Error fetching ${articlePath}: ${error.message}`);
    if (error.message === "Article not found") {
      res.status(404).send("Article not found");
    } else {
      res.status(500).send("Error fetching article");
    }
  }
};
