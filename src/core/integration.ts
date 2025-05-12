/**
 * Core integration functionality for Astro SEO Checker
 */

import { fileURLToPath } from 'url';
import { join } from 'path';
import fs from 'fs';
import fastGlob from 'fast-glob';

import { normalizeHtmlFilePath } from '../phases/utils.js';
import { runPhases, phases } from '../phases/index.js';
import { AstroLogger, AstroSeoCheckerOptions, PhaseOptions } from '../types/index.js';
import {
  SeoCheckerError,
  FilesystemError,
  handleError
} from '../errors.js';
import { generateReport } from './report.js';

/**
 * Create the Astro SEO Checker integration
 * 
 * @param options Configuration options
 * @returns Astro integration object
 */
export function createIntegration(options: AstroSeoCheckerOptions = {}) {
  // Default options
  const reportFilePath = options.reportFilePath || options.logFilePath || 'site-report.log';
  const reportFormat = options.reportFormat; // Auto-detected from file extension if not specified
  const brokenLinksMap: Map<string, Set<string>> = new Map(); // Map of brokenLink -> Set of documents
  const checkedLinks: Map<string, boolean> = new Map();
  const seoIssuesMap: Map<string, Map<string, Set<string>>> = new Map(); // Map of category -> Map of issue -> Set of documents

  // Configure phases from options
  // We need to use type assertion here since we're using 'as const' for phases
  const mutablePhases = phases as unknown as Record<string, { enabled: boolean }>;
  if (options.phases) {
    for (const [phaseId, enabled] of Object.entries(options.phases)) {
      if (mutablePhases[phaseId]) {
        mutablePhases[phaseId].enabled = enabled ?? true;
      }
    }
  }
  
  // Configure email allowlist
  options.emailAllowlist = options.emailAllowlist || [];

  return {
    name: 'astro-seo-checker',
    hooks: {
      'astro:config:setup': async ({ config }: { config: { redirects?: Record<string, any> } }) => {
        // Save the redirects to the options
        options.astroConfigRedirects = config.redirects;
      },
      
      'astro:build:done': async ({ dir, logger }: { dir: URL; logger: AstroLogger }) => {
        try {
          const astroConfigRedirects = options.astroConfigRedirects;
          const distPath = fileURLToPath(dir);
          
          // Validate the build directory
          if (!fs.existsSync(distPath)) {
            throw new FilesystemError(
              `Build directory not found: ${distPath}`,
              { 
                fatal: true,
                suggestion: "Make sure your Astro build has completed successfully before running SEO checks."
              }
            );
          }
          
          // Find HTML files
          const htmlFiles = await fastGlob('**/*.html', { cwd: distPath });
          
          if (htmlFiles.length === 0) {
            logger.warn(`
⚠️  No HTML files found in ${distPath}
   This could mean your Astro build didn't generate any HTML files.
   Make sure your build is configured correctly and try again.
            `);
            return; // Early exit
          }

          // Count enabled phases for better progress reporting
          const enabledPhases = Object.values(phases).filter(phase => phase.enabled).length;
          
          if (enabledPhases === 0) {
            logger.warn(`
⚠️  No SEO check phases are enabled
   All checks have been disabled in your configuration.
   Enable at least one phase to perform SEO checks.
            `);
            return; // Early exit
          }

          logger.info(`
🔍 Starting SEO check on ${htmlFiles.length} HTML pages
   Running ${enabledPhases} enabled phases: ${Object.values(phases)
     .filter(phase => phase.enabled)
     .map(phase => phase.name)
     .join(', ')}
          `);

          // Start time
          const startTime = Date.now();

          // Resolve report file path to absolute path in the output directory
          const absoluteReportFilePath = join(distPath, reportFilePath);

          // Track progress for large projects
          let pagesProcessed = 0;
          const totalPages = htmlFiles.length;
          const errors: any[] = [];

          const checkHtmlPromises = htmlFiles.map(async (htmlFile) => {
            try {
              const absoluteHtmlFilePath = join(distPath, htmlFile);
              
              // Check if file exists and is readable
              if (!fs.existsSync(absoluteHtmlFilePath)) {
                throw new FilesystemError(`HTML file not found: ${absoluteHtmlFilePath}`);
              }
              
              // Read file content
              let htmlContent;
              try {
                htmlContent = fs.readFileSync(absoluteHtmlFilePath, 'utf8');
              } catch (error) {
                throw new FilesystemError(
                  `Could not read HTML file: ${absoluteHtmlFilePath}`,
                  { suggestion: "Check file permissions and ensure the file is not locked by another process." }
                );
              }
              
              const baseUrl = normalizeHtmlFilePath(absoluteHtmlFilePath, distPath);

              // Set up options for the phase runner with links checking
              const phaseOptions: PhaseOptions = {
                ...options,
                brokenLinksMap,
                checkedLinks,
                astroConfigRedirects,
                logger,
                // Only enable verbose logging if specifically requested
                verbose: options.verbose || false
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

              // Update progress
              pagesProcessed++;

              // For large sites (>50 pages), show periodic progress
              if (totalPages > 50 && pagesProcessed % 10 === 0) {
                const percent = Math.round((pagesProcessed / totalPages) * 100);
                logger.info(`   Progress: ${percent}% (${pagesProcessed}/${totalPages} pages scanned)`);
              }
            } catch (error) {
              // Collect errors but don't stop processing
              errors.push(error);
              
              // Log the error
              if (error instanceof SeoCheckerError) {
                handleError(error, logger, false);
              } else {
                logger.error(`Error processing file ${htmlFile}: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
          });
          
          // Wait for all checks to complete
          await Promise.all(checkHtmlPromises);
          
          // Show summary of any errors
          if (errors.length > 0) {
            logger.warn(`
⚠️  Completed with ${errors.length} error${errors.length !== 1 ? 's' : ''}
   Some files could not be processed. See above for details.
   Results will be incomplete for these files.
            `);
          }
          
          // Generate and write report
          try {
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
          } catch (error) {
            if (error instanceof SeoCheckerError) {
              handleError(error, logger, false);
            } else {
              logger.error(`Failed to generate report: ${error instanceof Error ? error.message : String(error)}`);
            }
            
            // Still show summary in console even if file writing failed
            const elapsedTime = (Date.now() - startTime) / 1000;
            logger.info(`
✨ Astro SEO Checker Summary ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Scan completed in ${elapsedTime.toFixed(2)} seconds
${brokenLinksMap.size > 0 ? `⚠️  Found ${brokenLinksMap.size} broken link${brokenLinksMap.size !== 1 ? 's' : ''}` : '✅ No broken links detected'}
${seoIssuesMap.size > 0 ? `⚠️  Found SEO issues in ${seoIssuesMap.size} categor${seoIssuesMap.size !== 1 ? 'ies' : 'y'}` : '✅ No SEO issues detected'}
            `);
          }
        } catch (error: any) {
          // Handle any unexpected errors
          if (error instanceof SeoCheckerError) {
            handleError(error, logger, true);
          } else {
            logger.error(`❌ Unexpected error during SEO check: ${error.message}`);
            if (options.verbose && error.stack) {
              logger.error(error.stack);
            }
          }
        }
      },
    },
  };
}