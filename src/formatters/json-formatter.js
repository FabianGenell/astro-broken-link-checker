/**
 * JSON Formatter
 * 
 * Creates a structured JSON report optimized for programmatic processing.
 * Follows a consistent structure that can be easily parsed by code.
 */

/**
 * Format report data as JSON
 * 
 * @param {Map} brokenLinksMap - Map of broken links to affected pages
 * @param {Map} seoIssuesMap - Map of SEO issues by category
 * @param {Object} options - Formatting options
 * @param {number} options.startTime - Start time of the scan in milliseconds
 * @returns {string} Formatted JSON content
 */
export function formatJSON(brokenLinksMap, seoIssuesMap, options) {
  // Calculate elapsed time
  const endTime = Date.now();
  const elapsedTime = (endTime - options.startTime) / 1000; // Convert to seconds
  
  // Create report object structure
  const report = {
    timestamp: new Date().toISOString(),
    scanDuration: elapsedTime,
    summary: {
      brokenLinkCount: brokenLinksMap.size,
      seoIssueCount: countTotalSeoIssues(seoIssuesMap),
      categories: getSeoIssueCountByCategory(seoIssuesMap)
    },
    brokenLinks: formatBrokenLinks(brokenLinksMap),
    seoIssues: formatSeoIssues(seoIssuesMap)
  };
  
  // Pretty-print JSON with 2-space indentation
  return JSON.stringify(report, null, 2);
}

/**
 * Count total number of SEO issues
 * 
 * @param {Map} seoIssuesMap - Map of SEO issues by category
 * @returns {number} - Total issue count
 */
function countTotalSeoIssues(seoIssuesMap) {
  let total = 0;
  for (const [_, issuesMap] of seoIssuesMap.entries()) {
    total += issuesMap.size;
  }
  return total;
}

/**
 * Count SEO issues by category
 * 
 * @param {Map} seoIssuesMap - Map of SEO issues by category
 * @returns {Object} - Object with category counts
 */
function getSeoIssueCountByCategory(seoIssuesMap) {
  const counts = {};
  
  for (const [category, issuesMap] of seoIssuesMap.entries()) {
    counts[category] = issuesMap.size;
  }
  
  return counts;
}

/**
 * Format broken links for JSON output
 * 
 * @param {Map} brokenLinksMap - Map of broken links to affected pages
 * @returns {Array} - Array of broken link objects
 */
function formatBrokenLinks(brokenLinksMap) {
  const links = [];
  
  for (const [url, pagesSet] of brokenLinksMap.entries()) {
    links.push({
      url,
      pages: Array.from(pagesSet)
    });
  }
  
  return links;
}

/**
 * Format SEO issues for JSON output
 * 
 * @param {Map} seoIssuesMap - Map of SEO issues by category
 * @returns {Object} - Categorized SEO issues
 */
function formatSeoIssues(seoIssuesMap) {
  const issues = {};
  
  for (const [category, issuesMap] of seoIssuesMap.entries()) {
    issues[category] = [];
    
    for (const [issue, pagesSet] of issuesMap.entries()) {
      issues[category].push({
        description: issue,
        pages: Array.from(pagesSet)
      });
    }
  }
  
  return issues;
}