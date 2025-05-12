import { fileURLToPath } from 'url';
import path, { join } from 'path';
import fs from 'fs';
import { normalizeHtmlFilePath } from './src/phases/utils.js';
import { runPhases, phases } from './src/phases/index.js';
import { formatReport, OUTPUT_FORMATS } from './src/formatters/index.js';
import fastGlob from 'fast-glob';

export default function astroBrokenLinksChecker(options = {}) {
  // Default options
  const reportFilePath = options.reportFilePath || options.logFilePath || 'site-report.log';
  const reportFormat = options.reportFormat; // Auto-detected from file extension if not specified
  const brokenLinksMap = new Map(); // Map of brokenLink -> Set of documents
  const checkedLinks = new Map();
  const seoIssuesMap = new Map(); // Map of category -> Map of issue -> Set of documents

  // Configure phases from options
  if (options.phases) {
    for (const [phaseId, enabled] of Object.entries(options.phases)) {
      if (phases[phaseId]) {
        phases[phaseId].enabled = enabled;
      }
    }
  }
  
  // Configure email allowlist
  options.emailAllowlist = options.emailAllowlist || [];

  return {
    name: 'astro-seo-checker',
    hooks: {
      'astro:config:setup': async ({ config }) => {
        // Save the redirects to the options
        options.astroConfigRedirects = config.redirects;
      },
      
      'astro:build:done': async ({ dir, logger }) => {
        const astroConfigRedirects = options.astroConfigRedirects;
        const distPath = fileURLToPath(dir);
        const htmlFiles = await fastGlob('**/*.html', { cwd: distPath });
        logger.info(`🔍 Checking ${htmlFiles.length} HTML pages for issues...`);
        
        // Start time
        const startTime = Date.now();
        
        // Resolve report file path to absolute path in the output directory
        const absoluteReportFilePath = join(distPath, reportFilePath);
        
        const checkHtmlPromises = htmlFiles.map(async (htmlFile) => {
          const absoluteHtmlFilePath = join(distPath, htmlFile);
          const htmlContent = fs.readFileSync(absoluteHtmlFilePath, 'utf8');
          const baseUrl = normalizeHtmlFilePath(absoluteHtmlFilePath, distPath);
          
          // Set up options for the phase runner with links checking
          const phaseOptions = {
            ...options,
            brokenLinksMap,
            checkedLinks,
            astroConfigRedirects,
            logger
          };

          // Run SEO check phases (including link checking in Foundation phase)
          await runPhases(
            htmlContent,
            seoIssuesMap,
            baseUrl,
            absoluteHtmlFilePath,
            distPath,
            phaseOptions,
            logger
          );
        });
        
        await Promise.all(checkHtmlPromises);
        
        // Generate and write report
        generateReport(
          brokenLinksMap,
          seoIssuesMap,
          {
            filePath: absoluteReportFilePath,
            format: reportFormat,
            startTime: startTime
          },
          logger
        );
      },
    },
  };
}

/**
 * Generate report and write to filesystem
 *
 * @param {Map} brokenLinksMap - Map of broken links to affected pages
 * @param {Map} seoIssuesMap - Map of SEO issues by category
 * @param {Object} options - Report options
 * @param {string} options.filePath - Path to write the report
 * @param {string} [options.format] - Optional format override
 * @param {number} options.startTime - Scan start time timestamp
 * @param {Object} logger - Astro logger instance
 */
function generateReport(brokenLinksMap, seoIssuesMap, options, logger) {
  // Calculate elapsed time
  const endTime = Date.now();
  const elapsedTime = (endTime - options.startTime) / 1000;

  // Format report using the appropriate formatter
  const reportData = formatReport(brokenLinksMap, seoIssuesMap, options);

  // Count totals for console summary
  const brokenLinkCount = brokenLinksMap.size;
  let totalSeoIssues = 0;
  const issueCategories = [];

  for (const [category, issuesMap] of seoIssuesMap.entries()) {
    totalSeoIssues += issuesMap.size;
    issueCategories.push(`${issuesMap.size} ${category}`);
  }

  // Write the report to file if file path is provided
  if (options.filePath) {
    // Ensure directory exists
    const reportDir = path.dirname(options.filePath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(options.filePath, reportData, 'utf8');

    // Log summary to console
    const format = options.format || path.extname(options.filePath).substring(1) || 'log';
    const formatName = format.toUpperCase();

    const summaryForConsole = `
🔍 Site Report Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Scan completed in ${elapsedTime.toFixed(2)} seconds
${brokenLinkCount > 0 ? `⚠️ Found ${brokenLinkCount} broken links` : '✅ No broken links detected'}
${totalSeoIssues > 0 ? `⚠️ Found ${totalSeoIssues} SEO issues` : '✅ No SEO issues detected'}
${issueCategories.length > 0 ? '  - ' + issueCategories.join('\n  - ') : ''}

📄 Full ${formatName} report written to: ${options.filePath}
`;

    logger.info(summaryForConsole);
  } else {
    // If no file path, just log the report directly
    logger.info(reportData);
  }
}


