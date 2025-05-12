import { defineConfig } from 'astro/config';
import astroBrokenLinksChecker from 'astro-broken-links-checker';

export default defineConfig({
  redirects: {
    '/redirected': '/about',
  },
  integrations: [astroBrokenLinksChecker({
    logFilePath: 'broken-links.log',
    seoReportPath: 'seo-report.log',
    emailAllowlist: ['allowlisted@example.com'],
    phases: {
      1: true, // Enable Phase 1 (Foundation + Privacy)
    }
  })],
});