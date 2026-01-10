/**
 * Wikipedia API Service
 * Handles fetching article content from Wikipedia REST API
 */

import axios from "axios";

class WikipediaService {
  constructor() {
    this.baseUrlEnglish = "https://en.wikipedia.org/api/rest_v1/page/html";
    this.baseUrlFrench = "https://fr.wikipedia.org/api/rest_v1/page/html";
    this.randomUrlEnglish = "https://en.wikipedia.org/api/rest_v1/page/random/summary";
    this.randomUrlFrench = "https://fr.wikipedia.org/api/rest_v1/page/random/summary";
  }

  /**
   * Fetch a random article from Wikipedia
   * @param {string} language - Language code ('en' or 'fr'), defaults to 'en'
   * @returns {Promise<Object>} Article info with title and other metadata
   */
  async fetchRandomArticle(language = 'en') {
    try {
      const randomUrl = language === 'fr' ? this.randomUrlFrench : this.randomUrlEnglish;
      
      console.log(`Fetching random article from Wikipedia API (${language})`);

      const response = await axios.get(randomUrl, {
        headers: {
          "User-Agent": "WikiDash/1.0 (Educational Project)",
        },
      });

      return {
        title: response.data.title,
        description: response.data.description,
        extract: response.data.extract
      };
    } catch (error) {
      console.error(`Error fetching random article: ${error.message}`);
      throw new Error(`Failed to fetch random article: ${error.message}`);
    }
  }

  /**
   * Fetch article HTML from Wikipedia REST API
   * @param {string} articlePath - Article path/title
   * @param {string} language - Language code ('en' or 'fr'), defaults to 'en'
   * @returns {Promise<string>} Article HTML content
   */
  async fetchArticleHtml(articlePath, language = 'en') {
    try {
      // Wikipedia API expects underscores in URLs
      const encodedPath = encodeURIComponent(articlePath.replace(/ /g, "_"));
      
      // Select base URL based on language
      const baseUrl = language === 'fr' ? this.baseUrlFrench : this.baseUrlEnglish;
      const url = `${baseUrl}/${encodedPath}`;

      console.log(`Fetching from Wikipedia API (${language}): ${articlePath}`);

      const response = await axios.get(url, {
        headers: {
          "User-Agent": "KiwixRacer/1.0 (Educational Project)",
        },
      });

      let html = response.data;

    //   // Fix relative URLs to point to Wikipedia
      const wikiDomain = language === 'fr' ? 'fr.wikipedia.org' : 'en.wikipedia.org';
      
      html = html.replace(/src="\/\//g, 'src="https://');
      html = html.replace(/src="\//g, `src="https://${wikiDomain}/`);
      html = html.replace(/href="\/\//g, 'href="https://');

      // Fix srcset attributes for responsive images
      html = html.replace(/srcset="\/\//g, 'srcset="https://');
      html = html.replace(/srcset="\//g, `srcset="https://${wikiDomain}/`);

      return html;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error("Article not found");
      }
      //console.error(`Error fetching from Wikipedia: ${error.message}`);
      throw new Error(`Failed to fetch article from Wikipedia:${error.message}`);
    }
  }
}

export default new WikipediaService();
