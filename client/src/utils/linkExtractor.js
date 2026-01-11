/**
 * Extract clickable Wikipedia article links from HTML content
 */

/**
 * Extract all valid article links from Wikipedia HTML
 * @param {string} htmlString - Raw HTML from Wikipedia API
 * @returns {Array<{text: string, path: string}>} Array of link objects
 */
export function extractArticleLinks(htmlString) {
  if (!htmlString) return [];

  try {
    // Parse HTML string into DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Get all links that start with "./" (internal Wikipedia links)
    const linkElements = doc.querySelectorAll('a[href^="./"]');

    // Map to link objects, filtering out invalid ones
    const links = Array.from(linkElements)
      .map((link) => {
        const href = link.getAttribute('href');
        if (!href) return null;

        // Remove the "./" prefix and decode URL encoding
        const fullPath = decodeURIComponent(href.substring(2));
        
        // Split on "#" to remove anchor fragments
        const path = fullPath.split('#')[0];

        // Filter out special pages (contain ":")
        if (path.includes(':')) return null;

        // Filter out links containing images
        if (link.querySelector('img')) return null;

        // Get display text (trim whitespace)
        const text = link.textContent.trim();
        if (!text) return null;

        return { text, path };
      })
      .filter(Boolean); // Remove null entries

    // Deduplicate by path (keep first occurrence)
    const seen = new Set();
    const uniqueLinks = links.filter((link) => {
      if (seen.has(link.path)) return false;
      seen.add(link.path);
      return true;
    });

    return uniqueLinks;
  } catch (error) {
    console.error('Error extracting links:', error);
    return [];
  }
}
