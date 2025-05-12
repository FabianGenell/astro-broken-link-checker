// Export all phase modules
import { checkPhase1 } from './phase-1.js';
import { checkPhase2 } from './phase-2.js';
import { checkPhase3 } from './phase-3.js';
import { checkPhase4 } from './phase-4.js';

// Re-export phase modules
export { checkPhase1, checkPhase2, checkPhase3, checkPhase4 };

// Export map of all phases for configuration
export const phases = {
  1: {
    name: 'Foundation + Privacy',
    handler: checkPhase1,
    description: 'Checks for broken links and exposed emails',
    enabled: true
  },
  2: {
    name: 'Metadata & Semantic Structure',
    handler: checkPhase2,
    description: 'Checks for missing or duplicate metadata and heading structure',
    enabled: false // Default disabled, can be enabled in config
  },
  3: {
    name: 'Accessibility & UX Flags',
    handler: checkPhase3,
    description: 'Checks for accessibility issues like missing alt tags and generic link text',
    enabled: false // Default disabled, can be enabled in config
  },
  4: {
    name: 'Performance & Technical SEO',
    handler: checkPhase4,
    description: 'Checks for performance issues like large images, render-blocking resources and mobile viewport',
    enabled: false // Default disabled, can be enabled in config
  },
  5: {
    name: 'Crawlability & Linking',
    handler: null, // Not implemented yet
    description: 'Detects SEO and crawlability issues',
    enabled: false
  }
};

// Run all enabled phases
export async function runPhases(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {},
  logger
) {
  // Log we're checking phases
  logger?.info(`Running enabled SEO check phases for ${documentPath}`);
  
  // Get configured phases
  const enabledPhases = Object.entries(phases)
    .filter(([_, phase]) => phase.enabled && phase.handler)
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