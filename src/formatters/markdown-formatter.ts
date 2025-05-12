/**
 * Markdown Formatter
 * 
 * Creates a human-readable Markdown report with clear section hierarchy.
 * Enhances the report with emoji, formatting, and better organization.
 */

import { CATEGORY_FORMATTING, CategoryId } from '../phases/types.js';
import { ReportOptions } from '../../index.js';

/**
 * Category summary interface
 */
interface CategorySummary {
  category: string;
  count: number;
}

/**
 * Format report data as Markdown
 * 
 * @param brokenLinksMap - Map of broken links to affected pages
 * @param seoIssuesMap - Map of SEO issues by category
 * @param options - Formatting options 
 * @returns Formatted Markdown content
 */
export function formatMarkdown(
  brokenLinksMap: Map<string, Set<string>>,
  seoIssuesMap: Map<string, Map<string, Set<string>>>,
  options: ReportOptions
): string {
  // Calculate elapsed time
  const endTime = Date.now();
  const elapsedTime = (endTime - options.startTime) / 1000; // Convert to seconds
  
  // Format timestamp for the report
  const timestamp = new Date().toISOString();
  
  // Start building report data
  let reportData = `# Site Report - ${timestamp}\n\n`;
  reportData += `Scan completed in ${elapsedTime.toFixed(2)} seconds\n\n`;
  
  // Count totals for summary
  const brokenLinkCount = brokenLinksMap.size;
  let totalSeoIssues = 0;
  const issueCategories: CategorySummary[] = [];
  
  for (const [category, issuesMap] of seoIssuesMap.entries()) {
    totalSeoIssues += issuesMap.size;
    issueCategories.push({
      category,
      count: issuesMap.size
    });
  }
  
  // Add summary section
  reportData += "## Summary\n\n";
  reportData += `- Broken Links: ${brokenLinkCount}\n`;
  reportData += `- SEO Issues: ${totalSeoIssues}\n`;
  
  if (issueCategories.length > 0) {
    // Sort categories by count (descending)
    issueCategories.sort((a, b) => b.count - a.count);
    
    for (const { category, count } of issueCategories) {
      reportData += `  - ${count} ${category}\n`;
    }
  }
  reportData += "\n";
  
  // Add broken links section if any exist
  if (brokenLinkCount > 0) {
    reportData += "## 🔗 Broken Links\n\n";
    
    // Sort broken links by number of occurrences (most problematic first)
    const sortedLinks = Array.from(brokenLinksMap.entries())
      .sort((a, b) => b[1].size - a[1].size);
    
    for (const [brokenLink, documentsSet] of sortedLinks) {
      const documents = Array.from(documentsSet).sort();
      reportData += `### ${brokenLink}\n\n`;
      reportData += "Found in:\n";
      
      for (const doc of documents) {
        reportData += `- ${doc}\n`;
      }
      reportData += "\n";
    }
  }
  
  // Add SEO issues section if any exist
  if (totalSeoIssues > 0) {
    reportData += "## 🔍 SEO Issues\n\n";
    
    // Sort categories for consistent display
    const sortedCategories = Array.from(seoIssuesMap.entries())
      .sort((a, b) => {
        // Sort by category display name
        const nameA = formatCategoryName(a[0]);
        const nameB = formatCategoryName(b[0]);
        return nameA.localeCompare(nameB);
      });
    
    for (const [category, issuesMap] of sortedCategories) {
      reportData += `### ${formatCategoryName(category)}\n\n`;
      
      // Sort issues by number of occurrences (most frequent first)
      const sortedIssues = Array.from(issuesMap.entries())
        .sort((a, b) => b[1].size - a[1].size);
      
      for (const [issue, documentsSet] of sortedIssues) {
        const documents = Array.from(documentsSet).sort();
        reportData += `#### ${issue}\n\n`;
        reportData += "Found in:\n";
        
        for (const doc of documents) {
          reportData += `- ${doc}\n`;
        }
        reportData += "\n";
      }
    }
  }
  
  return reportData;
}

/**
 * Format category name for display
 * 
 * @param category - Category identifier
 * @returns Formatted category name
 */
function formatCategoryName(category: string): string {
  // Return mapped category name if it exists
  if (CATEGORY_FORMATTING[category as CategoryId]) {
    return CATEGORY_FORMATTING[category as CategoryId];
  }
  
  // Default formatting for unmapped categories
  return category
    .split(':')
    .map(part => part.trim().charAt(0).toUpperCase() + part.trim().slice(1))
    .join(': ');
}