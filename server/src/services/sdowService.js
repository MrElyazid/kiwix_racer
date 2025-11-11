/**
 * Six Degrees of Wikipedia (SDOW) Database Service
 * Handles queries to the SDOW SQLite database for pathfinding and graph visualization
 *
 * Database Schema:
 * - pages: id, title, is_redirect
 * - links: id, outgoing_links_count, incoming_links_count, outgoing_links, incoming_links
 * - redirects: source_id, target_id
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to SDOW database
const SDOW_DB_PATH = path.join(__dirname, "../../../data/sdow/sdow.sqlite");

let db = null;

/**
 * Initialize database connection
 */
function initDatabase() {
  if (!db) {
    try {
      db = new Database(SDOW_DB_PATH, { readonly: true, fileMustExist: true });
      console.log("SDOW database connected successfully");
    } catch (error) {
      console.error("Failed to connect to SDOW database:", error.message);
      console.error("Expected path:", SDOW_DB_PATH);
      throw error;
    }
  }
  return db;
}

/**
 * Find a page by title (case-insensitive)
 * @param {string} title - Article title (e.g., "Albert_Einstein")
 * @returns {Object|null} Page object with {id, title, is_redirect} or null
 */
export function findPageByTitle(title) {
  const database = initDatabase();

  const stmt = database.prepare(`
    SELECT id, title, is_redirect 
    FROM pages 
    WHERE title = ? COLLATE NOCASE
  `);

  return stmt.get(title);
}

/**
 * Find multiple pages by IDs
 * @param {Array<number>} ids - Array of page IDs
 * @returns {Array<Object>} Array of page objects
 */
export function findPagesByIds(ids) {
  if (!ids || ids.length === 0) return [];

  const database = initDatabase();
  const placeholders = ids.map(() => "?").join(",");

  const stmt = database.prepare(`
    SELECT id, title, is_redirect 
    FROM pages 
    WHERE id IN (${placeholders})
  `);

  return stmt.all(...ids);
}

/**
 * Get link data for a page
 * @param {number} pageId - Page ID
 * @returns {Object|null} Link data with outgoing/incoming links
 */
export function getPageLinks(pageId) {
  const database = initDatabase();

  const stmt = database.prepare(`
    SELECT id, outgoing_links_count, incoming_links_count, 
           outgoing_links, incoming_links
    FROM links 
    WHERE id = ?
  `);

  const result = stmt.get(pageId);

  if (!result) return null;

  // Parse pipe-separated link strings into arrays
  return {
    id: result.id,
    outgoing_links_count: result.outgoing_links_count,
    incoming_links_count: result.incoming_links_count,
    outgoing_links: result.outgoing_links
      ? result.outgoing_links.split("|").map(Number)
      : [],
    incoming_links: result.incoming_links
      ? result.incoming_links.split("|").map(Number)
      : [],
  };
}

/**
 * Resolve a redirect to its target page
 * @param {number} sourceId - Redirect page ID
 * @returns {Object|null} Target page object or null
 */
export function resolveRedirect(sourceId) {
  const database = initDatabase();

  const stmt = database.prepare(`
    SELECT target_id, pages.title 
    FROM redirects 
    INNER JOIN pages ON pages.id = redirects.target_id 
    WHERE source_id = ?
  `);

  return stmt.get(sourceId);
}

/**
 * Search for pages by title prefix
 * @param {string} query - Search query
 * @param {number} limit - Maximum results to return
 * @returns {Array<Object>} Array of matching pages
 */
export function searchPages(query, limit = 10) {
  const database = initDatabase();

  const stmt = database.prepare(`
    SELECT id, title, is_redirect 
    FROM pages 
    WHERE title LIKE ? COLLATE NOCASE 
    AND is_redirect = 0
    LIMIT ?
  `);

  return stmt.all(`${query}%`, limit);
}

/**
 * Get a random article (non-redirect)
 * @returns {Object|null} Random page object
 */
export function getRandomPage() {
  const database = initDatabase();

  const stmt = database.prepare(`
    SELECT id, title, is_redirect 
    FROM pages 
    WHERE is_redirect = 0 
    ORDER BY RANDOM() 
    LIMIT 1
  `);

  return stmt.get();
}

/**
 * Get database statistics
 * @returns {Object} Database stats
 */
export function getDatabaseStats() {
  const database = initDatabase();

  const pageCount = database
    .prepare("SELECT COUNT(*) as count FROM pages")
    .get();
  const linkCount = database
    .prepare("SELECT COUNT(*) as count FROM links")
    .get();
  const redirectCount = database
    .prepare("SELECT COUNT(*) as count FROM redirects")
    .get();

  return {
    total_pages: pageCount.count,
    total_links: linkCount.count,
    total_redirects: redirectCount.count,
  };
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log("SDOW database connection closed");
  }
}

// Export default for convenience
export default {
  findPageByTitle,
  findPagesByIds,
  getPageLinks,
  resolveRedirect,
  searchPages,
  getRandomPage,
  getDatabaseStats,
  closeDatabase,
};
