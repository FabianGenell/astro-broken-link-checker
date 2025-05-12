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
      3: true, // Enable Phase 3 (Accessibility & UX Flags)
      4: true, // Enable Phase 4 (Performance & Technical SEO)
    },
    checkCanonical: true, // Enable canonical link checking
    ignoreEmptyAlt: true, // Don't flag empty alt attributes (they might be intentional for decorative images),
    checkResourceSizes: true, // Enable resource size checking in Phase 4
    inlineScriptThreshold: 2, // KB threshold for inline scripts
    inlineStyleThreshold: 1, // KB threshold for inline styles
    imageSizeThreshold: 200 // KB threshold for image size warnings
  })],
});