import { defineConfig } from 'astro/config';
import astroBrokenLinksChecker from 'astro-broken-links-checker';

export default defineConfig({
  redirects: {
    '/redirected': '/about',
  },
  integrations: [astroBrokenLinksChecker({
    logFilePath: 'site-report.log',  // Single consolidated log file
    checkExternalLinks: false,      // Disable external link checking for faster tests
    emailAllowlist: ['allowlisted@example.com'],
    phases: {
      1: true, // Enable Phase 1 (Foundation + Privacy)
      2: true, // Enable Phase 2 (Metadata & Semantic Structure)
    },
    checkCanonical: true, // Enable canonical link checking
  })],
});