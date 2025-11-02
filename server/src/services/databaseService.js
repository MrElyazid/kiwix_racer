/**
 * Database Service
 * Handles interaction with SQLite databases containing article metadata and links
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
  constructor() {
    this.connections = new Map();
  }

  /**
   * Get or create database connection
   * @param {string} dbPath - Path to SQLite database
   */
  getConnection(dbPath) {
    if (!this.connections.has(dbPath)) {
      try {
        const db = new Database(dbPath, { readonly: true });
        this.connections.set(dbPath, db);
        console.log(`Connected to database: ${dbPath}`);
      } catch (error) {
        console.error(`Error connecting to database: ${error.message}`);
        throw error;
      }
    }
    return this.connections.get(dbPath);
  }

  /**
   * Get article metadata
   * @param {string} title - Article title
   * @param {string} dbPath - Database path
   */
  getArticleMetadata(title, dbPath) {
    try {
      const db = this.getConnection(dbPath);
      // TODO: Adjust query based on actual schema from your scripts
      const stmt = db.prepare("SELECT * FROM articles WHERE title = ?");
      return stmt.get(title);
    } catch (error) {
      console.error(`Error getting article metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get article links
   * @param {string} title - Article title
   * @param {string} dbPath - Database path
   */
  getArticleLinks(title, dbPath) {
    try {
      const db = this.getConnection(dbPath);
      // TODO: Adjust query based on actual schema
      const stmt = db.prepare("SELECT * FROM links WHERE source = ?");
      return stmt.all(title);
    } catch (error) {
      console.error(`Error getting article links: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search articles by title
   * @param {string} query - Search query
   * @param {string} dbPath - Database path
   * @param {number} limit - Maximum number of results
   */
  searchArticles(query, dbPath, limit = 10) {
    try {
      const db = this.getConnection(dbPath);
      // TODO: Adjust query based on actual schema
      const stmt = db.prepare(
        "SELECT * FROM articles WHERE title LIKE ? LIMIT ?"
      );
      return stmt.all(`%${query}%`, limit);
    } catch (error) {
      console.error(`Error searching articles: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get random article
   * @param {string} dbPath - Database path
   */
  getRandomArticle(dbPath) {
    try {
      const db = this.getConnection(dbPath);
      // TODO: Adjust query based on actual schema
      const stmt = db.prepare(
        "SELECT * FROM articles ORDER BY RANDOM() LIMIT 1"
      );
      return stmt.get();
    } catch (error) {
      console.error(`Error getting random article: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close all database connections
   */
  closeAll() {
    for (const [path, db] of this.connections) {
      db.close();
      console.log(`Closed database connection: ${path}`);
    }
    this.connections.clear();
  }
}

export default new DatabaseService();
