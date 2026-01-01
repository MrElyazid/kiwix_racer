/**
 * Wikipedia API Service
 * Handles fetching article content from Wikipedia REST API
 */

import axios from "axios";

class WikipediaService {
  constructor() {
    this.baseUrlEnglish = "https://en.wikipedia.org/api/rest_v1/page/html";
    this.baseUrlFrench = "https://fr.wikipedia.org/api/rest_v1/page/html";
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
