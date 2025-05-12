/**
 * Simplified API for Astro SEO Checker
 * 
 * This file provides a more user-friendly API for common use cases,
 * making integration simpler while still allowing for advanced configuration.
 */

import { AstroSeoCheckerOptions, OutputFormat } from './types/index.js';
import { createIntegration } from './core/integration.js';
import {
  minimalPreset,
  standardPreset,
  comprehensivePreset,
  performancePreset,
  accessibilityPreset,
  aiDetectionPreset,
  extendPreset
} from './presets.js';

// Re-export the presets for direct access
export {
  minimalPreset,
  standardPreset,
  comprehensivePreset,
  performancePreset,
  accessibilityPreset,
  aiDetectionPreset,
  extendPreset
};

/**
 * Create an SEO checker with minimal configuration and AI detection
 * Checks broken links, basic metadata, and AI-generated content
 *
 * @param reportPath - Path to save the report (optional)
 * @param outputDir - Custom output directory for the report (optional)
 * @param useAbsolutePaths - Whether to treat paths as absolute (optional)
 * @returns Configured Astro SEO Checker integration
 */
export function createMinimalChecker(
  reportPath?: string,
  outputDir?: string,
  useAbsolutePaths = false
) {
  const options = {
    ...minimalPreset,
    reportOutputDir: outputDir,
    useAbsolutePaths: useAbsolutePaths
  };
  if (reportPath) options.reportFilePath = reportPath;
  return createIntegration(options);
}

/**
 * Create an SEO checker with standard configuration
 * Balanced set of checks suitable for most websites
 *
 * @param reportPath - Path to save the report (optional)
 * @param checkExternal - Whether to check external links (defaults to false)
 * @param outputDir - Custom output directory for the report (optional)
 * @param useAbsolutePaths - Whether to treat paths as absolute (optional)
 * @returns Configured Astro SEO Checker integration
 */
export function createStandardChecker(
  reportPath?: string,
  checkExternal = false,
  outputDir?: string,
  useAbsolutePaths = false
) {
  const options = {
    ...standardPreset,
    checkExternalLinks: checkExternal,
    reportOutputDir: outputDir,
    useAbsolutePaths: useAbsolutePaths
  };
  if (reportPath) options.reportFilePath = reportPath;
  return createIntegration(options);
}

/**
 * Create an SEO checker with comprehensive configuration
 * All checks enabled, best for projects where SEO is critical
 *
 * @param reportPath - Path to save the report (optional)
 * @param outputDir - Custom output directory for the report (optional)
 * @param useAbsolutePaths - Whether to treat paths as absolute (optional)
 * @returns Configured Astro SEO Checker integration
 */
export function createComprehensiveChecker(
  reportPath?: string,
  outputDir?: string,
  useAbsolutePaths = false
) {
  const options = {
    ...comprehensivePreset,
    reportOutputDir: outputDir,
    useAbsolutePaths: useAbsolutePaths
  };
  if (reportPath) options.reportFilePath = reportPath;
  return createIntegration(options);
}

/**
 * Create an SEO checker focused on performance issues
 *
 * @param reportPath - Path to save the report (optional)
 * @param outputDir - Custom output directory for the report (optional)
 * @param useAbsolutePaths - Whether to treat paths as absolute (optional)
 * @returns Configured Astro SEO Checker integration
 */
export function createPerformanceChecker(
  reportPath?: string,
  outputDir?: string,
  useAbsolutePaths = false
) {
  const options = {
    ...performancePreset,
    reportOutputDir: outputDir,
    useAbsolutePaths: useAbsolutePaths
  };
  if (reportPath) options.reportFilePath = reportPath;
  return createIntegration(options);
}

/**
 * Create an SEO checker focused on accessibility issues
 *
 * @param reportPath - Path to save the report (optional)
 * @param outputDir - Custom output directory for the report (optional)
 * @param useAbsolutePaths - Whether to treat paths as absolute (optional)
 * @returns Configured Astro SEO Checker integration
 */
export function createAccessibilityChecker(
  reportPath?: string,
  outputDir?: string,
  useAbsolutePaths = false
) {
  const options = {
    ...accessibilityPreset,
    reportOutputDir: outputDir,
    useAbsolutePaths: useAbsolutePaths
  };
  if (reportPath) options.reportFilePath = reportPath;
  return createIntegration(options);
}

/**
 * Create an SEO checker focused on AI content detection
 *
 * @param reportPath - Path to save the report (optional)
 * @param threshold - AI detection sensitivity threshold (optional, default is 60)
 * @param outputDir - Custom output directory for the report (optional)
 * @param useAbsolutePaths - Whether to treat paths as absolute (optional)
 * @returns Configured Astro SEO Checker integration
 */
export function createAiDetectionChecker(
  reportPath?: string,
  threshold = 60,
  outputDir?: string,
  useAbsolutePaths = false
) {
  const options = {
    ...aiDetectionPreset,
    aiDetectionThreshold: threshold,
    reportOutputDir: outputDir,
    useAbsolutePaths: useAbsolutePaths
  };
  if (reportPath) options.reportFilePath = reportPath;
  return createIntegration(options);
}

/**
 * Create a custom SEO checker with specific report format
 *
 * @param format - Output format (markdown, json, csv)
 * @param reportPath - Path to save the report (optional)
 * @param basePreset - Base preset to extend (defaults to standard)
 * @param outputDir - Custom output directory for the report (optional)
 * @param useAbsolutePaths - Whether to treat paths as absolute (optional)
 * @returns Configured Astro SEO Checker integration
 */
export function createFormattedChecker(
  format: OutputFormat,
  reportPath?: string,
  basePreset = standardPreset,
  outputDir?: string,
  useAbsolutePaths = false
) {
  const options = {
    ...basePreset,
    reportFormat: format,
    reportOutputDir: outputDir,
    useAbsolutePaths: useAbsolutePaths
  };

  if (reportPath) {
    options.reportFilePath = reportPath;
  } else {
    // Set default filename with proper extension based on format
    const extension = format === 'json' ? '.json' :
                      format === 'csv' ? '.csv' :
                      format === 'markdown' ? '.md' : '.log';
    options.reportFilePath = `site-report${extension}`;
  }

  return createIntegration(options);
}

/**
 * Create a completely custom SEO checker by extending a preset
 * 
 * @param customOptions - Custom options to use
 * @param basePreset - Base preset to extend (defaults to standard)
 * @returns Configured Astro SEO Checker integration
 */
export function createCustomChecker(
  customOptions: Partial<AstroSeoCheckerOptions>,
  basePreset = standardPreset
) {
  return createIntegration(extendPreset(basePreset, customOptions));
}