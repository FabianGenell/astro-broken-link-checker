# Astro SEO Checker

An Astro integration that checks for broken links and SEO issues in your website during static build. It logs any problems to the console and writes them to log files, grouping them by category and the document in which they occur.

## Features

### Link Checking

- **Checks Internal and External Links**: Validates all `<a href="...">` links found in your HTML pages.
- **Logs Broken Links**: Outputs broken link information to both the console and a log file.
- **Grouped by broken URL**: To allow for quick search and replacement, a list of all pages containing the broken URL is logged.
- **Caching Mechanism**: Avoids redundant checks by caching the results of previously checked links.
- **Parallel Processing**: Checks links and does IO and network operations in parallel to improve performance.
- **Local redirect awareness**: If a link is redirected in astro.config.mjs, it will be followed.
- **Timeouts and retries**: To avoid false positives, links that fail to load with ECONNRESET are retried 3 times with exponential backoff.

### SEO Analysis

The integration includes a phased SEO analysis system:

#### Phase 1: Foundation + Privacy

- **Email Exposure Detection**: Finds and reports raw email addresses in page content that could be harvested by spambots.
- **Unobfuscated Mailto Links**: Warns about `mailto:` links that display the raw email address.
- **Email Allowlist**: Configure exemptions for specific email addresses that don't need to be obfuscated.

#### Phase 2: Metadata & Semantic Structure

- **Metadata Validation**: Checks for missing or empty `<title>` and `<meta name="description">` tags.
- **Duplicate Detection**: Identifies pages using identical titles or descriptions across your site.
- **Heading Structure**: Ensures each page has exactly one `<h1>` tag, and it contains content.
- **Language Attribute**: Validates the presence and value of the `<html lang="">` attribute.
- **Canonical Links**: Verifies that `<link rel="canonical">` points to the correct page.

#### Phase 3: Accessibility & UX Flags

- **Image Alternatives**: Identifies `<img>` tags missing required `alt` attributes.
- **Interactive Elements**: Flags buttons and links without accessible text content or ARIA labels.
- **Generic Link Text**: Detects non-descriptive link text like "click here", "read more", or "learn more" that provides poor context for screen readers and search engines.

#### Phase 4: Performance & Technical SEO

- **Layout Shift Prevention**: Detects images missing width and height attributes that can cause layout shifts.
- **Render-Blocking Resources**: Identifies JavaScript files without async/defer attributes and blocking CSS.
- **Inline Code Analysis**: Flags excessive inline CSS and JavaScript that should be moved to external files.
- **Mobile Viewport**: Validates mobile viewport meta tag configuration and zoom capability.
- **Resource Size**: Optionally checks for large unoptimized images and other resources.

#### Phase 5: Crawlability & Linking

- **Robots Meta Tags**: Identifies pages with noindex, nofollow, or noarchive directives that affect search engine crawling.
- **Internal Linking Analysis**: Detects pages with too few or too many internal links affecting crawl efficiency.
- **Nofollow Internal Links**: Warns about internal links with rel="nofollow" that can harm your site's crawlability.
- **Missing Files**: Checks for the presence of robots.txt and sitemap.xml in your build output.
- **Validation**: Performs basic validation of robots.txt and sitemap.xml files.

## Installation

Install the package and its peer dependencies using a [GitHub reference](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#github-urls) in your `package.json`:

```json
  ...
  "dependencies": {
    "astro": "5.1.9",
    "astro-seo-checker": "FabianGenell/astro-seo-checker",
    ...
```

> [!NOTE]
> In the future, if/when `astro-seo-checker` becomes available on NPM:
> ```bash
> npm install astro-seo-checker
> ```

## Configuration

Update your `astro.config.mjs` with your desired options:

```js
import { defineConfig } from 'astro/config';
import astroSeoChecker from 'astro-seo-checker';

export default defineConfig({
  // ... other configurations ...
  integrations: [
    astroSeoChecker({
      // Basic options
      logFilePath: 'site-report.log',     // Path for the consolidated report
      checkExternalLinks: false,          // Check external links (slower)

      // SEO checker options
      emailAllowlist: ['example@domain.com', 'admin@example.org'],  // Emails to ignore
      checkCanonical: true,               // Validate canonical links

      // Enable/disable specific phases
      phases: {
        foundation: true,    // Foundation & Privacy
        metadata: true,      // Metadata & Semantic Structure
        accessibility: true, // Accessibility & UX Flags
        performance: true,   // Performance & Technical SEO
        crawlability: true,  // Crawlability & Linking
      },

      // Accessibility options
      ignoreEmptyAlt: true,          // Don't flag empty alt attributes (decorative images)

      // Performance & Technical SEO options
      checkResourceSizes: true,      // Enable file size checking for resources
      imageSizeThreshold: 200,       // Size threshold for images in KB
      inlineScriptThreshold: 2,      // Size threshold for inline scripts in KB
      inlineStyleThreshold: 1,       // Size threshold for inline styles in KB

      // Crawlability options
      minInternalLinks: 3,           // Minimum recommended internal links per page
      maxInternalLinks: 100          // Maximum recommended internal links per page
    }),
  ],
});
```

## Reports

The integration produces a consolidated report file:

**site-report.log**: A comprehensive Markdown-formatted report that includes:

- **Summary**: Total counts of broken links and SEO issues by category
- **Broken Links**: All broken links found during the build process, grouped by URL
- **SEO Issues**: All detected SEO issues organized by category, such as:
  - Privacy issues (exposed emails)
  - Metadata issues (missing/empty titles, descriptions)
  - Semantic structure problems (h1 tags, language attributes)
  - Duplicate content warnings (identical titles or descriptions)
  - Canonical link validation results
  - Accessibility issues (missing alt tags, unlabeled elements, generic link text)
  - Performance problems (layout shifts, render-blocking resources)
  - Technical SEO issues (mobile viewport configuration)
  - Crawlability warnings (noindex/nofollow tags, linking structure)
  - Missing critical files (robots.txt, sitemap.xml)

## Development and Testing

To contribute to this project:

```bash
# Clone the repository
git clone https://github.com/FabianGenell/astro-seo-checker.git

# Install dependencies
npm install

# Run tests
npm test

# Run tests with watch mode during development
npm run test:watch
```