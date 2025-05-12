/**
 * Central registry for all SEO check phases
 * 
 * This file exports:
 * 1. Individual phase handler functions
 * 2. Phase configuration registry (for enabling/disabling phases)
 * 3. runPhases utility that executes enabled phases
 */

// Import phase handlers
import { checkFoundationPhase } from './foundation-phase.js';
import { checkMetadataPhase } from './metadata-phase.js';
import { checkAccessibilityPhase } from './accessibility-phase.js';
import { checkPerformancePhase } from './performance-phase.js';
import { checkCrawlabilityPhase } from './crawlability-phase.js';
import { checkAiDetectionPhase } from './ai-detection-phase.js';

// Import phase identifiers
import { PHASE_IDS } from './types.js';

// Re-export phase modules for direct access if needed
export {
  checkFoundationPhase,
  checkMetadataPhase,
  checkAccessibilityPhase,
  checkPerformancePhase,
  checkCrawlabilityPhase,
  checkAiDetectionPhase
};

/**
 * Phase configuration registry
 * - Each phase has a name, description, handler function and enabled status
 * - Used for configuration and phase execution
 */
export const phases = {
  [PHASE_IDS.FOUNDATION]: {
    name: 'Foundation & Privacy',
    handler: checkFoundationPhase,
    description: 'Checks for broken links and exposed emails',
    enabled: true
  },
  [PHASE_IDS.METADATA]: {
    name: 'Metadata & Semantic Structure',
    handler: checkMetadataPhase,
    description: 'Checks for missing or duplicate metadata and heading structure',
    enabled: true
  },
  [PHASE_IDS.ACCESSIBILITY]: {
    name: 'Accessibility & UX Flags',
    handler: checkAccessibilityPhase,
    description: 'Checks for accessibility issues like missing alt tags and generic link text',
    enabled: true
  },
  [PHASE_IDS.PERFORMANCE]: {
    name: 'Performance & Technical SEO',
    handler: checkPerformancePhase,
    description: 'Checks for performance issues like large images, render-blocking resources and mobile viewport',
    enabled: true
  },
  [PHASE_IDS.CRAWLABILITY]: {
    name: 'Crawlability & Linking',
    handler: checkCrawlabilityPhase,
    description: 'Detects robots.txt issues, noindex/nofollow tags, and internal linking problems',
    enabled: true
  },
  [PHASE_IDS.AI_DETECTION]: {
    name: 'AI Content Detection',
    handler: checkAiDetectionPhase,
    description: 'Detects potentially AI-generated content based on writing patterns',
    enabled: true
  }
};

/**
 * Runs all enabled SEO check phases on a given HTML document
 * 
 * @param {string} htmlContent - Raw HTML content to analyze
 * @param {Map} issuesMap - Map to store found issues
 * @param {string} baseUrl - Base URL for the document (for resolving relative links)
 * @param {string} documentPath - Absolute path to the HTML file
 * @param {string} distPath - Absolute path to the build output directory
 * @param {Object} options - Configuration options for checks
 * @param {Object} logger - Logger instance for output
 */
export async function runPhases(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {},
  logger
) {
  // Log that we're checking phases
  logger?.info(`Running enabled SEO check phases for ${documentPath}`);
  
  // Get all enabled phases with valid handlers
  const enabledPhases = Object.entries(phases)
    .filter(([_, phase]) => phase.enabled && typeof phase.handler === 'function')
    .map(([id, phase]) => ({ id, ...phase }));
  
  // Run each enabled phase
  for (const phase of enabledPhases) {
    try {
      await phase.handler(
        htmlContent,
        issuesMap,
        baseUrl,
        documentPath,
        distPath,
        options
      );
    } catch (error) {
      logger?.error(`Error in phase ${phase.id} (${phase.name}): ${error.message}`);
    }
  }
}