/**
 * Astro SEO Checker
 * 
 * An Astro integration that checks for broken links and SEO issues in your website
 * during static build. It logs any problems to the console and writes them to log files.
 */

// Main integration function
import { createIntegration } from './src/core/integration.js';

// Export all types for external use
export * from './src/types/index.js';
export * from './src/errors.js';

// Export simplified API functions and presets
export * from './src/simplified-api.js';

// Default export is the integration function
export default createIntegration;