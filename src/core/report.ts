/**
 * Report generation functionality for Astro SEO Checker
 */

import path from 'path';
import fs from 'fs';
import { formatReport } from '../formatters/index.js';
import { 
  AstroLogger, 
  CategoryGroups, 
  GroupEmojis, 
  ReportOptions 
} from '../types/index.js';
import { ConfigError, FilesystemError } from '../errors.js';

/**
 * Generate report and write to filesystem
 *
 * @param brokenLinksMap - Map of broken links to affected pages
 * @param seoIssuesMap - Map of SEO issues by category
 * @param options - Report options
 * @param logger - Astro logger instance
 * @throws {FilesystemError} If report directory can't be created or file can't be written
 * @throws {ConfigError} If report format is invalid
 */
export function generateReport(
  brokenLinksMap: Map<string, Set<string>>,
  seoIssuesMap: Map<string, Map<string, Set<string>>>,
  options: ReportOptions,
  logger: AstroLogger
): void {
  // Calculate elapsed time
  const endTime = Date.now();
  const elapsedTime = (endTime - options.startTime) / 1000;

  // Validate format if explicitly provided
  if (options.format && !['markdown', 'json', 'csv'].includes(options.format.toLowerCase())) {
    throw new ConfigError(
      `Invalid report format: '${options.format}'`,
      {
        suggestion: "Valid formats are 'markdown', 'json', or 'csv'. You can also omit the format to auto-detect from file extension."
      }
    );
  }

  // Format report using the appropriate formatter
  let reportData: string;
  try {
    reportData = formatReport(brokenLinksMap, seoIssuesMap, options);
  } catch (error: any) {
    throw new ConfigError(
      `Failed to format report: ${error.message}`,
      {
        suggestion: "Check the report format and try again. If the issue persists, try a different format."
      }
    );
  }

  // Count totals for console summary
  const brokenLinkCount = brokenLinksMap.size;
  let totalSeoIssues = 0;
  const issueCategories: string[] = [];

  for (const [category, issuesMap] of seoIssuesMap.entries()) {
    totalSeoIssues += issuesMap.size;
    issueCategories.push(`${issuesMap.size} ${category}`);
  }

  // Write the report to file if file path is provided
  if (options.filePath) {
    // Ensure directory exists
    const reportDir = path.dirname(options.filePath);
    if (!fs.existsSync(reportDir)) {
      try {
        fs.mkdirSync(reportDir, { recursive: true });
      } catch (error) {
        throw new FilesystemError(
          `Could not create report directory: ${reportDir}`,
          {
            suggestion: "Check directory permissions or specify a different report location."
          }
        );
      }
    }

    // Write report file
    try {
      fs.writeFileSync(options.filePath, reportData, 'utf8');
    } catch (error) {
      throw new FilesystemError(
        `Could not write report to: ${options.filePath}`,
        {
          suggestion: "Check write permissions or specify a different report location."
        }
      );
    }

    // Log summary to console
    const format = options.format || path.extname(options.filePath).substring(1) || 'log';
    const formatName = format.toUpperCase();

    // Group categories by type for better organization
    const categoryGroups: CategoryGroups = {
      performance: [],
      accessibility: [],
      metadata: [],
      semantic: [],
      crawlability: [],
      linking: [],
      content: [],
      privacy: [],
      technical: []
    };

    // Sort issues into category groups
    for (const category of issueCategories) {
      const [count, ...parts] = category.split(' ');
      const categoryString = parts.join(' ');

      // Find which group this belongs to
      for (const groupName of Object.keys(categoryGroups)) {
        if (categoryString.startsWith(groupName)) {
          categoryGroups[groupName].push({ count: parseInt(count, 10), category: categoryString });
          break;
        }
      }
    }

    // Generate category output with colors
    let categoriesByGroup = '';

    if (issueCategories.length > 0) {
      // First add high-level summary by group
      categoriesByGroup = '\n\n  Issue breakdown:';

      // Sort groups by priority for display
      const groupDisplayOrder = [
        'performance', 'accessibility', 'metadata',
        'crawlability', 'linking', 'technical',
        'content', 'privacy', 'semantic'
      ];

      // Add emojis for each group
      const groupEmojis: GroupEmojis = {
        performance: '⚡',
        accessibility: '♿',
        metadata: '📄',
        crawlability: '🔍',
        linking: '🔗',
        technical: '🔧',
        content: '📝',
        privacy: '🔒',
        semantic: '🏗️'
      };

      // Format the category groups for display
      for (const group of groupDisplayOrder) {
        const issues = categoryGroups[group];
        if (issues && issues.length > 0) {
          // Calculate total issues in this group
          const totalInGroup = issues.reduce((sum, issue) => sum + issue.count, 0);

          // Add group header
          categoriesByGroup += `\n    ${groupEmojis[group]} ${group[0].toUpperCase() + group.slice(1)}: ${totalInGroup} issue${totalInGroup !== 1 ? 's' : ''}`;

          // Sort issues within the group by count (descending)
          issues.sort((a, b) => b.count - a.count);

          // Add each issue in the group
          for (const { count, category } of issues) {
            // Extract the specific issue type from the category
            const issueType = category.split(': ')[1] || category;
            categoriesByGroup += `\n      • ${issueType}: ${count}`;
          }
        }
      }
    }

    // Add recommendations if there are issues
    let recommendations = '';
    if (brokenLinkCount > 0 || totalSeoIssues > 0) {
      recommendations = `
📋 Next steps:
  • Review the full report at ${options.filePath}
  • Fix the most critical issues first (broken links, missing metadata)
  • Re-run the check after making changes`;
    }

    const summaryForConsole = `
✨ Astro SEO Checker Report ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Scan completed in ${elapsedTime.toFixed(2)} seconds

📊 Summary:
  ${brokenLinkCount > 0 ? `⚠️  ${brokenLinkCount} broken link${brokenLinkCount !== 1 ? 's' : ''}` : '✅ No broken links detected'}
  ${totalSeoIssues > 0 ? `⚠️  ${totalSeoIssues} SEO issue${totalSeoIssues !== 1 ? 's' : ''}` : '✅ No SEO issues detected'}${categoriesByGroup}

📄 Full ${formatName} report written to:
  ${options.filePath}${recommendations}
`;

    logger.info(summaryForConsole);
  } else {
    // If no file path, just log the report directly
    logger.info(reportData);
  }
}