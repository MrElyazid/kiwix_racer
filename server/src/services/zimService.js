/**
 * ZIM Service
 * Handles interaction with ZIM files using @openzim/libzim
 */

import { Archive } from "@openzim/libzim";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ZimService {
  constructor() {
    this.archives = new Map();
    this.defaultArchive = null;
  }

  /**
   * Load a ZIM file
   * @param {string} zimPath - Path to the ZIM file
   * @param {string} name - Name identifier for the archive
   */
  async loadZimFile(zimPath, name = "default") {
    try {
      if (!fs.existsSync(zimPath)) {
        throw new Error(`ZIM file not found: ${zimPath}`);
      }

      const archive = new Archive(zimPath);
      this.archives.set(name, archive);

      if (!this.defaultArchive) {
        this.defaultArchive = archive;
      }

      console.log(`✓ ZIM archive loaded: ${name}`);
      console.log(`  File: ${zimPath}`);
      console.log(`  Articles: ${archive.entryCount}`);

      return archive;
    } catch (error) {
      console.error(`Error loading ZIM file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get archive by name
   * @param {string} name - Archive name
   */
  getArchive(name = "default") {
    return this.archives.get(name) || this.defaultArchive;
  }

  /**
   * Get list of articles with pagination and search
   * @param {Object} options - Query options
   */
  getArticleList(options = {}) {
    const {
      limit = 100,
      offset = 0,
      search = "",
      archiveName = "default",
    } = options;

    const archive = this.getArchive(archiveName);
    if (!archive) {
      throw new Error("No archive loaded");
    }

    const articles = [];
    let count = 0;
    let added = 0;

    const iterator = archive.iterByPath();

    for (const entry of iterator) {
      try {
        if (entry.isRedirect) continue;

        const entryPath = entry.path;
        const title = entry.title;

        if (search && !title.toLowerCase().includes(search.toLowerCase())) {
          continue;
        }

        try {
          const item = entry.getItem();
          if (item.mimetype === "text/html" && item.size > 500) {
            if (count < offset) {
              count++;
              continue;
            }

            articles.push({
              path: entryPath,
              title: title,
              size: item.size,
            });
            added++;
            count++;

            if (added >= limit) break;
          }
        } catch (e) {
          // Skip entries that can't be accessed
        }
      } catch (e) {
        continue;
      }
    }

    return {
      articles,
      offset,
      limit,
      count: articles.length,
    };
  }

  /**
   * Get article content by path
   * @param {string} articlePath - Article path in ZIM
   * @param {string} archiveName - Archive name
   */
  getArticleByPath(articlePath, archiveName = "default") {
    const archive = this.getArchive(archiveName);
    if (!archive) {
      throw new Error("No archive loaded");
    }

    let entry;
    try {
      entry = archive.getEntryByPath(articlePath);
    } catch (e) {
      throw new Error("Article not found");
    }

    if (!entry) {
      throw new Error("Article not found");
    }

    // Handle redirects
    if (entry.isRedirect) {
      const redirectEntry = entry.getRedirectEntry();
      return this.getArticleByPath(redirectEntry.path, archiveName);
    }

    const item = entry.getItem();
    const blob = item.getData();

    return {
      path: articlePath,
      title: entry.title,
      content: blob.toString(),
      mimetype: item.mimetype,
      size: item.size,
    };
  }

  /**
   * Get article content by title
   * @param {string} title - Article title
   * @param {string} archiveName - Archive name
   */
  getArticleByTitle(title, archiveName = "default") {
    const archive = this.getArchive(archiveName);
    if (!archive) {
      throw new Error("No archive loaded");
    }

    try {
      const entry = archive.getEntryByTitle(title);
      if (!entry) {
        throw new Error("Article not found");
      }

      if (entry.isRedirect) {
        const redirectEntry = entry.getRedirectEntry();
        return this.getArticleByPath(redirectEntry.path, archiveName);
      }

      const item = entry.getItem();
      const blob = item.getData();

      return {
        path: entry.path,
        title: entry.title,
        content: blob.toString(),
        mimetype: item.mimetype,
        size: item.size,
      };
    } catch (e) {
      throw new Error("Article not found");
    }
  }

  /**
   * Get random article
   * @param {string} archiveName - Archive name
   */
  getRandomArticle(archiveName = "default") {
    const archive = this.getArchive(archiveName);
    if (!archive) {
      throw new Error("No archive loaded");
    }

    const iterator = archive.iterByPath();
    const articles = [];
    let count = 0;

    for (const entry of iterator) {
      try {
        if (entry.isRedirect) continue;

        const item = entry.getItem();
        if (item.mimetype === "text/html" && item.size > 500) {
          articles.push({
            path: entry.path,
            title: entry.title,
          });
          count++;

          if (count >= 100) break;
        }
      } catch (e) {
        continue;
      }
    }

    if (articles.length === 0) {
      throw new Error("No articles found");
    }

    const randomIndex = Math.floor(Math.random() * articles.length);
    return articles[randomIndex];
  }
}

export default new ZimService();
