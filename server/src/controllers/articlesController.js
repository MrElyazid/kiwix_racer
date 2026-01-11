/**
 * Articles Controller
 * Handles requests related to Wikipedia articles
 */

import wikipediaService from "../services/wikipediaService.js";

/**
 * Get a random Wikipedia article
 */
export const getRandomArticle = async (req, res) => {
  try {
    const language = req.query.language || 'en';
    const article = await wikipediaService.fetchRandomArticle(language);
    res.json(article);
  } catch (error) {
    console.error(`Error fetching random article: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch random article' });
  }
};

/**
 * Get article content by title
 */
export const getArticleByTitle = async (req, res) => {
  try {
    const { title } = req.params;
    const language = req.query.language || 'en';
    
    if (!title) {
      return res.status(400).json({ error: 'Article title required' });
    }

    const html = await wikipediaService.fetchArticleHtml(title, language);
    res.json({ html });
  } catch (error) {
    console.error(`Error fetching article ${req.params.title}: ${error.message}`);
    if (error.message === "Article not found") {
      res.status(404).json({ error: 'Article not found' });
    } else {
      res.status(500).json({ error: 'Error fetching article' });
    }
  }
};

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
