// Export all phase modules
import { checkPhase1 } from './phase-1.js';

// Re-export phase modules
export { checkPhase1 };

// Export map of all phases for configuration
export const phases = {
  1: {
    name: 'Foundation + Privacy',
    handler: checkPhase1,
    description: 'Checks for broken links and exposed emails',
    enabled: true
  },
  // Future phases will be added here
  2: {
    name: 'Metadata & Semantic Structure',
    handler: null, // Not implemented yet
    description: 'Checks for missing or duplicate metadata and heading structure',
    enabled: false
  },
  3: {
    name: 'Accessibility & UX Flags',
    handler: null, // Not implemented yet
    description: 'Checks for accessibility issues like missing alt tags',
    enabled: false
  },
  4: {
    name: 'Performance Warnings',
    handler: null, // Not implemented yet
    description: 'Identifies performance issues with images and fonts',
    enabled: false
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