/**
 * Utility functions for graph visualization
 */

/**
 * Clean article title by removing escape characters
 * @param {string} title - Article title
 * @returns {string} Cleaned title
 */
export function cleanArticleTitle(title) {
  return title ? title.replace(/\\'/g, "'").replace(/\\/g, "") : title;
}

/**
 * Generate Wikipedia URL from article title
 * @param {string} title - Article title
 * @returns {string} Wikipedia URL
 */
export function getWikipediaUrl(title) {
  const clean = cleanArticleTitle(title);
  const encoded = encodeURIComponent(clean.replace(/ /g, "_"));
  return `https://en.wikipedia.org/wiki/${encoded}`;
}

/**
 * Convert spaces to underscores in text and adjust caret position
 * @param {string} text - Input text
 * @param {number} caretPos - Current caret position
 * @returns {{newVal: string, newPos: number}} Updated text and caret position
 */
export function convertSpacesToUnderscores(text, caretPos) {
  const newVal = text.replace(/\s+/g, "_");
  const diff = newVal.length - text.length;
  const newPos = Math.max(0, caretPos + diff);
  return { newVal, newPos };
}

/**
 * Create path nodes for visualization from exploration path
 * @param {Array} explorationPath - Array of path nodes
 * @param {Object} selectedTarget - Target article object
 * @returns {Array} Array of formatted path nodes
 */
export function createPathNodes(explorationPath, selectedTarget) {
  return explorationPath.map((node, index) => ({
    id: node.id || node.title,
    title: node.title,
    inPath: true,
    isExplorationRoot: index === 0,
    isCurrentNode: index === explorationPath.length - 1,
    isTargetNode: selectedTarget && node.title === selectedTarget.title,
  }));
}

/**
 * Create path links for visualization from exploration path
 * @param {Array} explorationPath - Array of path nodes
 * @returns {Array} Array of formatted path links
 */
export function createPathLinks(explorationPath) {
  const links = [];
  for (let i = 0; i < explorationPath.length - 1; i++) {
    links.push({
      source: explorationPath[i].id || explorationPath[i].title,
      target: explorationPath[i + 1].id || explorationPath[i + 1].title,
      isPath: true,
    });
  }
  return links;
}

/**
 * Format milliseconds to MM:SS format
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time string
 */
export function formatMsToMinutesSeconds(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
