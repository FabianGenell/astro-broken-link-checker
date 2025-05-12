/**
 * CSV Formatter
 * 
 * Formats SEO issues and broken links as CSV for importing into
 * spreadsheet applications or data analysis tools.
 */

/**
 * Format report data as CSV
 * 
 * @param {Map} brokenLinksMap - Map of broken links to affected pages
 * @param {Map} seoIssuesMap - Map of SEO issues by category
 * @param {Object} options - Formatting options
 * @param {number} options.startTime - Start time of the scan in milliseconds
 * @returns {string} Formatted CSV content
 */
export function formatCSV(brokenLinksMap, seoIssuesMap, options) {
  // Start with CSV headers
  let csvContent = "issue_type,category,issue,page,timestamp\n";
  
  // Format timestamp
  const timestamp = new Date().toISOString();
  
  // Process broken links
  for (const [brokenLink, pagesSet] of brokenLinksMap.entries()) {
    const escapedLink = escapeCsvField(brokenLink);
    
    for (const page of pagesSet) {
      csvContent += `"broken_link","broken_link","${escapedLink}","${escapeCsvField(page)}","${timestamp}"\n`;
    }
  }
  
  // Process SEO issues
  for (const [category, issuesMap] of seoIssuesMap.entries()) {
    const escapedCategory = escapeCsvField(category);
    
    for (const [issue, pagesSet] of issuesMap.entries()) {
      const escapedIssue = escapeCsvField(issue);
      
      for (const page of pagesSet) {
        csvContent += `"seo_issue","${escapedCategory}","${escapedIssue}","${escapeCsvField(page)}","${timestamp}"\n`;
      }
    }
  }
  
  return csvContent;
}

/**
 * Escape a value for CSV format
 * 
 * @param {string} value - Field value to escape
 * @returns {string} - Escaped CSV field value
 */
function escapeCsvField(value) {
  // Convert to string if not already
  const str = String(value);
  
  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  
  return escaped;
}