import { fileURLToPath } from 'url';
import path, { join } from 'path';
import fs from 'fs';
import { checkLinksInHtml, normalizeHtmlFilePath } from './check-links.js';
import { runPhases, phases } from './src/phases/index.js';
import fastGlob from 'fast-glob';

export default function astroBrokenLinksChecker(options = {}) {
  // Default options
  const logFilePath = options.logFilePath || 'site-report.log';
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
        
        // Resolve log file path to absolute path in the output directory
        const absoluteLogFilePath = join(distPath, logFilePath);
        
        const checkHtmlPromises = htmlFiles.map(async (htmlFile) => {
          const absoluteHtmlFilePath = join(distPath, htmlFile);
          const htmlContent = fs.readFileSync(absoluteHtmlFilePath, 'utf8');
          const baseUrl = normalizeHtmlFilePath(absoluteHtmlFilePath, distPath);
          
          // Check broken links (original functionality)
          await checkLinksInHtml(
            htmlContent,
            brokenLinksMap,
            baseUrl,
            absoluteHtmlFilePath, // Document path
            checkedLinks,
            distPath,
            astroConfigRedirects,
            logger,
            options.checkExternalLinks
          );
          
          // Run SEO check phases
          await runPhases(
            htmlContent,
            seoIssuesMap,
            baseUrl,
            absoluteHtmlFilePath,
            distPath,
            options,
            logger
          );
        });
        
        await Promise.all(checkHtmlPromises);
        
        // Generate and log combined report
        generateReport(
          brokenLinksMap, 
          seoIssuesMap, 
          absoluteLogFilePath, 
          logger, 
          startTime
        );
      },
    },
  };
}

// Function to generate a comprehensive report
function generateReport(brokenLinksMap, seoIssuesMap, logFilePath, logger, startTime) {
  // Calculate elapsed time
  const endTime = Date.now();
  const elapsedTime = (endTime - startTime) / 1000; // Convert to seconds
  
  // Format timestamp for the report
  const timestamp = new Date().toISOString();
  
  // Start building report data
  let reportData = `# Site Report - ${timestamp}\n\n`;
  reportData += `Scan completed in ${elapsedTime.toFixed(2)} seconds\n\n`;
  
  // Count totals for summary
  const brokenLinkCount = brokenLinksMap.size;
  let totalSeoIssues = 0;
  const issueCategories = [];
  
  for (const [category, issuesMap] of seoIssuesMap.entries()) {
    totalSeoIssues += issuesMap.size;
    issueCategories.push(`${issuesMap.size} ${category}`);
  }

  // Add summary section
  reportData += "## Summary\n\n";
  reportData += `- Broken Links: ${brokenLinkCount}\n`;
  reportData += `- SEO Issues: ${totalSeoIssues}\n`;
  
  if (issueCategories.length > 0) {
    reportData += "  - " + issueCategories.join("\n  - ") + "\n";
  }
  reportData += "\n";
  
  // Add broken links section if any exist
  if (brokenLinkCount > 0) {
    reportData += "## 🔗 Broken Links\n\n";
    
    for (const [brokenLink, documentsSet] of brokenLinksMap.entries()) {
      const documents = Array.from(documentsSet);
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
    
    for (const [category, issuesMap] of seoIssuesMap.entries()) {
      reportData += `### ${formatCategoryName(category)}\n\n`;
      
      for (const [issue, documentsSet] of issuesMap.entries()) {
        const documents = Array.from(documentsSet);
        reportData += `#### ${issue}\n\n`;
        reportData += "Found in:\n";
        
        for (const doc of documents) {
          reportData += `- ${doc}\n`;
        }
        reportData += "\n";
      }
    }
  }
  
  // Write the report to file
  if (logFilePath) {
    // Ensure directory exists
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.writeFileSync(logFilePath, reportData, 'utf8');
    
    // Log to console with improved formatting
    const summaryForConsole = `
🔍 Site Report Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Scan completed in ${elapsedTime.toFixed(2)} seconds
${brokenLinkCount > 0 ? `⚠️ Found ${brokenLinkCount} broken links` : '✅ No broken links detected'}
${totalSeoIssues > 0 ? `⚠️ Found ${totalSeoIssues} SEO issues` : '✅ No SEO issues detected'}
${issueCategories.length > 0 ? '  - ' + issueCategories.join('\n  - ') : ''}

📄 Full report written to: ${logFilePath}
`;
    
    logger.info(summaryForConsole);
  } else {
    logger.info(reportData);
  }
}

// Helper to format category names for display
function formatCategoryName(category) {
  // Add specific formatting for each category
  const categoryFormatMap = {
    'privacy: exposed email': '🔒 Privacy: Exposed Email Addresses',
    'metadata: missing elements': '📄 Metadata: Missing Elements',
    'metadata: empty elements': '📄 Metadata: Empty Elements',
    'metadata: duplicates': '🔄 Metadata: Duplicates Across Pages',
    'semantic: heading structure': '🏗️ Semantic: Heading Structure Issues',
    'semantic: language': '🌐 Semantic: Language Attribute Issues',
    'metadata: canonical': '🔗 Metadata: Canonical Link Issues'
  };

  // Return mapped category name if it exists
  if (categoryFormatMap[category]) {
    return categoryFormatMap[category];
  }

  // Default formatting for unmapped categories
  return category
    .split(':')
    .map(part => part.trim().charAt(0).toUpperCase() + part.trim().slice(1))
    .join(': ');
}