/**
 * Presets for common SEO Checker configurations
 * 
 * These presets make it easier for users to get started with common configurations
 * without having to specify all the options manually.
 */

import { AstroSeoCheckerOptions } from './types/index.js';

/**
 * Minimal preset with essential checks plus AI detection
 * Focuses on critical SEO issues like broken links, metadata, and AI content detection
 */
export const minimalPreset: AstroSeoCheckerOptions = {
  reportFilePath: 'site-report.log',
  checkExternalLinks: false,
  phases: {
    foundation: true,  // Keep broken links checking
    metadata: true,    // Keep metadata checks
    accessibility: false,
    performance: false,
    crawlability: false,
    ai_detection: true  // Enable AI content detection
  },
  // Default threshold for AI detection
  aiDetectionThreshold: 75
};

/**
 * Standard preset with a balanced set of checks
 * Good for most websites with a reasonable amount of content
 */
export const standardPreset: AstroSeoCheckerOptions = {
  reportFilePath: 'site-report.log',
  checkExternalLinks: false,
  phases: {
    foundation: true,
    metadata: true,
    accessibility: true,
    performance: true,
    crawlability: true,
    ai_detection: false  // Disabled by default as it can be slow
  },
  // Reasonable defaults for common options
  ignoreEmptyAlt: true,
  checkResourceSizes: true,
  imageSizeThreshold: 200,
  minInternalLinks: 3,
  maxInternalLinks: 100
};

/**
 * Comprehensive preset with all checks enabled
 * Best for projects where SEO is critical and performance is not an issue
 */
export const comprehensivePreset: AstroSeoCheckerOptions = {
  reportFilePath: 'site-report.log',
  checkExternalLinks: true,  // Check external links for comprehensive analysis
  phases: {
    foundation: true,
    metadata: true,
    accessibility: true,
    performance: true,
    crawlability: true,
    ai_detection: true
  },
  // Stricter thresholds for comprehensive checking
  ignoreEmptyAlt: false,
  checkResourceSizes: true,
  imageSizeThreshold: 150,  // Lower threshold for image size warnings
  inlineScriptThreshold: 1, // Lower threshold for inline scripts
  inlineStyleThreshold: 0.5, // Lower threshold for inline styles
  minInternalLinks: 2,
  maxInternalLinks: 75,
  aiDetectionThreshold: 65
};

/**
 * Performance-focused preset
 * Focuses on performance and technical SEO issues
 */
export const performancePreset: AstroSeoCheckerOptions = {
  reportFilePath: 'site-report-performance.log',
  checkExternalLinks: false,
  phases: {
    foundation: false,
    metadata: false,
    accessibility: false,
    performance: true,
    crawlability: false,
    ai_detection: false
  },
  // Strict performance settings
  checkResourceSizes: true,
  imageSizeThreshold: 100,  // Even lower threshold for images
  inlineScriptThreshold: 0.5,
  inlineStyleThreshold: 0.2
};

/**
 * Accessibility-focused preset
 * Focuses on accessibility issues
 */
export const accessibilityPreset: AstroSeoCheckerOptions = {
  reportFilePath: 'site-report-a11y.log',
  checkExternalLinks: false,
  phases: {
    foundation: false,
    metadata: false,
    accessibility: true,
    performance: false,
    crawlability: false,
    ai_detection: false
  },
  // Strict accessibility settings
  ignoreEmptyAlt: false
};

/**
 * AI content detection focused preset
 * Specifically for identifying potentially AI-generated content
 */
export const aiDetectionPreset: AstroSeoCheckerOptions = {
  reportFilePath: 'site-report-ai.log',
  checkExternalLinks: false,
  phases: {
    foundation: false,
    metadata: false,
    accessibility: false,
    performance: false,
    crawlability: false,
    ai_detection: true
  },
  // More sensitive AI detection threshold
  aiDetectionThreshold: 60,
  // Exclude specific paths if needed
  aiDetectionExcludePaths: []
};

/**
 * Create a custom preset by extending an existing preset
 * 
 * @param basePreset - The preset to extend
 * @param customOptions - Custom options to override the preset
 * @returns The combined options
 */
export function extendPreset(
  basePreset: AstroSeoCheckerOptions,
  customOptions: Partial<AstroSeoCheckerOptions>
): AstroSeoCheckerOptions {
  // For phases, we need to merge rather than replace
  if (basePreset.phases && customOptions.phases) {
    customOptions.phases = {
      ...basePreset.phases,
      ...customOptions.phases
    };
  }
  
  return {
    ...basePreset,
    ...customOptions
  };
}