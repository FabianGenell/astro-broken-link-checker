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
import { AstroLogger, PhaseOptions } from '../../index.js';

/**
 * Phase handler function type
 */
export type PhaseHandler = (
  htmlContent: string,
  issuesMap: Map<string, Map<string, Set<string>>>,
  baseUrl: string,
  documentPath: string,
  distPath: string,
  options?: Record<string, any>
) => Promise<void>;

/**
 * Phase configuration
 */
export interface Phase {
  /** Display name of the phase */
  name: string;
  /** Phase handler function */
  handler: PhaseHandler;
  /** Description of what the phase checks */
  description: string;
  /** Whether the phase is enabled */
  enabled: boolean;
}

/**
 * Phase with ID type
 */
export interface PhaseWithId extends Phase {
  /** Phase identifier */
  id: string;
}

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
} as const;

/**
 * Runs all enabled SEO check phases on a given HTML document
 *
 * @param htmlContent - Raw HTML content to analyze
 * @param issuesMap - Map to store found issues
 * @param baseUrl - Base URL for the document (for resolving relative links)
 * @param documentPath - Absolute path to the HTML file
 * @param distPath - Absolute path to the build output directory
 * @param options - Configuration options for checks
 * @param logger - Logger instance for output
 */
export async function runPhases(
  htmlContent: string,
  issuesMap: Map<string, Map<string, Set<string>>>,
  baseUrl: string,
  documentPath: string,
  distPath: string,
  options: PhaseOptions,
  logger?: AstroLogger
): Promise<void> {
  // Get a simplified path for logs
  const simplePath = documentPath.replace(distPath, '').replace('/index.html', '/');

  // We'll only log the page path if we're in verbose mode or if it's the first few pages
  // This reduces log noise while still providing some visibility
  const isVerboseLogging = options.verbose || false;

  // Get all enabled phases with valid handlers
  const enabledPhases: PhaseWithId[] = Object.entries(phases)
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
    } catch (error: any) {  // Using any here as error may not be Error type
      // Always log errors
      logger?.error(`Error in phase '${phase.name}' on page ${simplePath}: ${error.message}`);

      // Log the stack trace if in verbose mode
      if (isVerboseLogging && error.stack) {
        logger?.error(error.stack);
      }
    }
  }
}