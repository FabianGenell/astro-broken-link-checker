import { fileURLToPath } from 'url';
import { join } from 'path';
import fs from 'fs';
import { checkLinksInHtml, normalizeHtmlFilePath } from './check-links.js';
import { runPhases, phases } from './src/phases/index.js';
import fastGlob from 'fast-glob';

export default function astroBrokenLinksChecker(options = {}) {
  // Default options
  const logFilePath = options.logFilePath || 'broken-links.log';
  const seoReportPath = options.seoReportPath || 'seo-report.log';
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
    name: 'astro-broken-links-checker',
    hooks: {
      'astro:config:setup': async ({ config }) => {
        // Save the redirects to the options
        options.astroConfigRedirects = config.redirects;
      },
      
      'astro:build:done': async ({ dir, logger }) => {
        const astroConfigRedirects = options.astroConfigRedirects;
        const distPath = fileURLToPath(dir);
        const htmlFiles = await fastGlob('**/*.html', { cwd: distPath });
        logger.info(`Checking ${htmlFiles.length} html pages for broken links and SEO issues`);
        
        // Start time
        const startTime = Date.now();
        
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
        
        // Log broken links (original functionality)
        logBrokenLinks(brokenLinksMap, logFilePath, logger);
        
        // Log SEO issues
        logSeoIssues(seoIssuesMap, seoReportPath, logger);
        
        // End time
        const endTime = Date.now();
        logger.info(`Time to check links and SEO: ${endTime - startTime} ms`);
      },
    },
  };
}

// Original function to log broken links
function logBrokenLinks(brokenLinksMap, logFilePath, logger) {
  if (brokenLinksMap.size > 0) {
    let logData = '';
    for (const [brokenLink, documentsSet] of brokenLinksMap.entries()) {
      const documents = Array.from(documentsSet);
      logData += `Broken link: ${brokenLink}\n  Found in:\n`;
      for (const doc of documents) {
        logData += `    - ${doc}\n`;
      }
    }
    logData = logData.trim();
    if (logFilePath) {
      fs.writeFileSync(logFilePath, logData, 'utf8');
      logger.info(`Broken links have been logged to ${logFilePath}`);
      logger.info(logData);
    } else {
      logger.info(logData);
    }
  } else {
    logger.info('No broken links detected.');
  }
}

// New function to log SEO issues by category
function logSeoIssues(seoIssuesMap, seoReportPath, logger) {
  if (seoIssuesMap.size > 0) {
    let logData = '# SEO Report\n\n';
    
    // For each category
    for (const [category, issuesMap] of seoIssuesMap.entries()) {
      logData += `## ${category}\n\n`;
      
      // For each issue in this category
      for (const [issue, documentsSet] of issuesMap.entries()) {
        const documents = Array.from(documentsSet);
        logData += `Issue: ${issue}\n  Found in:\n`;
        
        for (const doc of documents) {
          logData += `    - ${doc}\n`;
        }
        
        logData += '\n';
      }
    }
    
    logData = logData.trim();
    
    if (seoReportPath) {
      fs.writeFileSync(seoReportPath, logData, 'utf8');
      logger.info(`SEO issues have been logged to ${seoReportPath}`);
      
      // Log a summary to the console
      const totalIssuesByCategory = Array.from(seoIssuesMap.entries()).map(
        ([category, issuesMap]) => `${category}: ${issuesMap.size} issues`
      );
      
      logger.info(`SEO Issues Summary: ${totalIssuesByCategory.join(', ')}`);
    } else {
      logger.info(logData);
    }
  } else {
    logger.info('No SEO issues detected.');
  }
}