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
    
    // Get language from query parameter, default to 'en'
    const language = req.query.lang || 'en';

    console.log(`Fetching article: ${articlePath} from Wikipedia API `);

    // Fetch from Wikipedia API with language parameter
    
    const html = await wikipediaService.fetchArticleHtml(articlePath, language);
    
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    // j'ai enleve le articlePath car ca casse le programme quand l'article n'existait pas
    console.error(`Error fetching : ${error.message}`);
    if (error.message === "Article not found") {
      res.status(404).send("Article not found");
    } else {
      res.status(500).send("Error fetching article");
    }
  }
};
