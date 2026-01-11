import { ref } from "vue";
import uFuzzy from "@leeoniya/ufuzzy";
import { extractArticleLinks } from "@/utils/linkExtractor";

/**
 * Composable for fuzzy searching article links
 * Provides debounced fuzzy search on extracted Wikipedia links
 */
export function useFuzzyLinkSearch() {
  // Cache of extracted links per article path
  const linkCache = ref(new Map());

  // Current article's links
  const currentLinks = ref([]);

  // Search results
  const searchResults = ref([]);
  const searchQuery = ref("");

  // Debounce timeout
  let searchTimeout = null;

  // Initialize uFuzzy with loose matching configuration
  const fuzzy = new uFuzzy({
    intraMode: 1, // Loose matching within terms
    intraIns: Infinity, // Allow any number of insertions
    intraSub: Infinity, // Allow any number of substitutions
    intraTrn: Infinity, // Allow any number of transpositions
    interLft: 0, // No left chars required between terms
    interRgt: 0, // No right chars required between terms
  });

  /**
   * Extract and cache links from article HTML
   * @param {string} articlePath - Article identifier for caching
   * @param {string} htmlContent - Raw HTML from Wikipedia
   */
  function extractAndCacheLinks(articlePath, htmlContent) {
    if (!articlePath || !htmlContent) {
      currentLinks.value = [];
      return;
    }

    // Check cache first
    if (linkCache.value.has(articlePath)) {
      currentLinks.value = linkCache.value.get(articlePath);
      return;
    }

    // Extract links
    const links = extractArticleLinks(htmlContent);
    
    // Cache results
    linkCache.value.set(articlePath, links);
    currentLinks.value = links;
  }

  /**
   * Perform fuzzy search on current article links (debounced)
   * @param {string} query - Search query
   * @param {Function} callback - Optional callback with results
   */
  function searchLinks(query, callback = null) {
    searchQuery.value = query;

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Clear results if query is empty
    if (!query || !query.trim()) {
      searchResults.value = [];
      if (callback) callback([]);
      return;
    }

    // Debounce search
    searchTimeout = setTimeout(() => {
      performSearch(query, callback);
    }, 300);
  }

  /**
   * Execute the actual fuzzy search
   * @param {string} query - Search query
   * @param {Function} callback - Optional callback with results
   */
  function performSearch(query, callback) {
    if (!currentLinks.value.length) {
      searchResults.value = [];
      if (callback) callback([]);
      return;
    }

    try {
      // Create array of link display texts for searching
      const haystack = currentLinks.value.map((link) => link.text);

      // Perform fuzzy search
      const idxs = fuzzy.filter(haystack, query.trim());

      if (!idxs || idxs.length === 0) {
        searchResults.value = [];
        if (callback) callback([]);
        return;
      }

      // Get matched links (limit to top 10 for performance)
      const matches = idxs
        .slice(0, 10)
        .map((idx) => currentLinks.value[idx])
        .filter(Boolean);

      searchResults.value = matches;
      if (callback) callback(matches);
    } catch (error) {
      console.error("Error performing fuzzy search:", error);
      searchResults.value = [];
      if (callback) callback([]);
    }
  }

  /**
   * Clear search state
   */
  function clearSearch() {
    searchQuery.value = "";
    searchResults.value = [];
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  }

  /**
   * Clear entire cache (useful for memory management)
   */
  function clearCache() {
    linkCache.value.clear();
    currentLinks.value = [];
  }

  /**
   * Highlight matched links in the article viewer
   * @param {HTMLElement} container - Article content container
   */
  function highlightMatches(container) {
    if (!container) return;

    // Always remove existing highlights first
    removeHighlights(container);

    // If no results, just stop after removing highlights
    if (searchResults.value.length === 0) return;

    // Get all links in the article
    const links = container.querySelectorAll('a[href^="./"]');
    
    // Create a set of matched paths for quick lookup
    const matchedPaths = new Set(
      searchResults.value.map(result => result.path)
    );

    let firstMatchedLink = null;

    // Highlight matching links
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('./')) {
        const path = decodeURIComponent(href.substring(2)).split('#')[0];
        if (matchedPaths.has(path)) {
          link.style.backgroundColor = '#fef08a'; // yellow-200
          link.style.borderRadius = '2px';
          link.style.padding = '1px 2px';
          link.classList.add('search-highlight');
          
          // Track first match
          if (!firstMatchedLink) {
            firstMatchedLink = link;
          }
        }
      }
    });

    // Scroll to first match
    if (firstMatchedLink) {
      firstMatchedLink.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }

  /**
   * Remove all search highlights
   * @param {HTMLElement} container - Article content container
   */
  function removeHighlights(container) {
    if (!container) return;

    const highlighted = container.querySelectorAll('.search-highlight');
    highlighted.forEach(link => {
      link.style.backgroundColor = '';
      link.style.borderRadius = '';
      link.style.padding = '';
      link.classList.remove('search-highlight');
    });
  }

  return {
    // State
    currentLinks,
    searchResults,
    searchQuery,

    // Methods
    extractAndCacheLinks,
    searchLinks,
    clearSearch,
    clearCache,
    highlightMatches,
    removeHighlights,
  };
}
