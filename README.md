# Astro Broken Links Checker & SEO Analyzer

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

More phases with additional SEO checks will be added in future releases, following our [roadmap](spec/new-phases.md).

## Installation

Install the package and its peer dependencies using a [GitHub reference](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#github-urls) in your `package.json`:

```json
  ...
  "dependencies": {
    "astro": "5.1.9",
    "astro-broken-link-checker": "imazen/astro-broken-link-checker",
    ...
```

> [!NOTE]
> In the future, if/when `astro-broken-link-checker` becomes available on NPM:
> ```bash
> npm install astro-broken-link-checker
> ```

## Configuration

Update your `astro.config.mjs` with your desired options:

```js
import { defineConfig } from 'astro/config';
import astroBrokenLinksChecker from 'astro-broken-link-checker';

export default defineConfig({
  // ... other configurations ...
  integrations: [
    astroBrokenLinksChecker({
      // Basic options
      logFilePath: 'site-report.log',     // Path for the consolidated report
      checkExternalLinks: false,          // Check external links (slower)

      // SEO checker options
      emailAllowlist: ['example@domain.com', 'admin@example.org'],  // Emails to ignore
      checkCanonical: true,               // Validate canonical links

      // Enable/disable specific phases
      phases: {
        1: true,    // Phase 1: Foundation + Privacy
        2: true,    // Phase 2: Metadata & Semantic Structure
        // Additional phases will be added here
      }
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

## Development and Testing

To contribute to this project:

```bash
# Clone the repository
git clone https://github.com/imazen/astro-broken-link-checker.git

# Install dependencies
npm install

# Run tests
npm test

# Run tests with watch mode during development
npm run test:watch
```