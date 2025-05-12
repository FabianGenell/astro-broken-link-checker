/**
 * Foundation & Privacy Phase
 *
 * This phase handles basic site health and privacy issues:
 * - Detection of broken links in <a> tags and <img> sources
 * - Detection of exposed email addresses in content
 * - Finding unobfuscated mailto: links
 */

import { parse } from 'node-html-parser';
import { CATEGORIES } from './types.js';
import {
  addIssue,
  extractTextContent,
  decodeHtmlEntities,
  normalizePath,
  normalizeHtmlFilePath
} from './utils.js';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import fetch from 'node-fetch';

// Constants
const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const GENERIC_OBFUSCATION_PATTERNS = ['[at]', '[dot]', ' at ', ' dot '];

/**
 * Main handler for Foundation & Privacy phase
 *
 * @param {string} htmlContent - Raw HTML content to analyze
 * @param {Map} issuesMap - Map to store found issues
 * @param {string} baseUrl - Base URL for the document
 * @param {string} documentPath - Path to the HTML file
 * @param {string} distPath - Path to the build output directory
 * @param {Object} options - Configuration options
 */
export async function checkFoundationPhase(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {}
) {
  const allowlist = options.emailAllowlist || [];
  const root = parse(htmlContent);

  // 1. Check for broken links (if brokenLinksMap is provided)
  if (options.brokenLinksMap) {
    await checkLinksInHtml(
      htmlContent,
      options.brokenLinksMap,
      baseUrl,
      documentPath,
      options.checkedLinks || new Map(),
      distPath,
      options.astroConfigRedirects || {},
      options.logger,
      options.checkExternalLinks
    );
  }

  // 2. Check for raw emails in text content
  const textContent = extractTextContent(root);
  const rawEmails = findRawEmails(textContent, allowlist);

  // Add any found raw emails to the issues map
  for (const email of rawEmails) {
    addIssue(
      issuesMap,
      documentPath,
      `Raw email exposed: ${email}`,
      CATEGORIES.PRIVACY_EMAIL,
      distPath
    );
  }

  // 3. Check for mailto: links without obfuscation
  const mailtoLinks = root.querySelectorAll('a[href^="mailto:"]');

  for (const link of mailtoLinks) {
    const href = link.getAttribute('href');
    const email = href.replace(/^mailto:/i, '').split('?')[0].trim();

    // Skip if in allowlist
    if (allowlist.includes(email)) {
      continue;
    }

    const linkText = link.textContent.trim();

    // Consider a mailto link unobfuscated if the link text IS the email address
    if (linkText === email || linkText.includes(email)) {
      addIssue(
        issuesMap,
        documentPath,
        `Unobfuscated mailto link: ${email}`,
        CATEGORIES.PRIVACY_EMAIL,
        distPath
      );
    }
  }
}

/**
 * Check for broken links in HTML content
 *
 * @param {string} htmlContent - HTML content to analyze
 * @param {Map} brokenLinksMap - Map to store broken links
 * @param {string} baseUrl - Base URL for the document
 * @param {string} documentPath - Path to the HTML file
 * @param {Map} checkedLinks - Map of previously checked links
 * @param {string} distPath - Path to the build output directory
 * @param {Object} astroConfigRedirects - Redirect configuration from Astro
 * @param {Object} logger - Logger instance
 * @param {boolean} checkExternalLinks - Whether to check external links
 */
async function checkLinksInHtml(
  htmlContent,
  brokenLinksMap,
  baseUrl,
  documentPath,
  checkedLinks = new Map(),
  distPath = '',
  astroConfigRedirects = {},
  logger,
  checkExternalLinks = true
) {
  const root = parse(htmlContent);
  const linkElements = root.querySelectorAll('a[href]');
  const links = linkElements.map((el) => el.getAttribute('href'));

  // Add img src links
  const imgElements = root.querySelectorAll('img[src]');
  const imgLinks = imgElements.map((el) => el.getAttribute('src'));
  links.push(...imgLinks);

  const limit = pLimit(50); // Limit to 50 concurrent link checks

  const checkLinkPromises = links.map((link) =>
    limit(async () => {
      if (!isValidUrl(link)) {
        return;
      }

      let absoluteLink;
      try {
        // Differentiate between absolute, domain-relative, and relative links
        if (/^https?:\/\//i.test(link) || /^:\/\//i.test(link)) {
          // Absolute URL
          absoluteLink = link;
        } else {
          // Handle URL encoding properly by first ensuring the link is properly encoded
          // This helps with links containing spaces and special characters
          const properlyEncodedLink = link.includes('%') ? link : encodeURI(link);
          absoluteLink = new URL(properlyEncodedLink, "https://localhost" + baseUrl).pathname;
        }
      } catch (err) {
        // Invalid URL, skip
        logger?.error(`Invalid URL in ${normalizePath(documentPath)} ${link} ${err}`);
        return;
      }

      let fetchLink = link;
      if (absoluteLink.startsWith('/') && distPath) {
        fetchLink = absoluteLink;
      }

      // Handle redirects defined in Astro configuration
      const decodedFetchLink = decodeURIComponent(fetchLink);
      if (astroConfigRedirects[fetchLink] || astroConfigRedirects[decodedFetchLink]) {
        const redirect = astroConfigRedirects[fetchLink] || astroConfigRedirects[decodedFetchLink];
        if (redirect) {
          fetchLink = redirect.destination ? redirect.destination : redirect;
        }
      }

      // Check if we've already validated this link, including the decoded version
      const normalizedFetchLink = fetchLink.includes('%') ? decodeURIComponent(fetchLink) : fetchLink;
      if (checkedLinks.has(fetchLink) || checkedLinks.has(normalizedFetchLink)) {
        const linkKey = checkedLinks.has(fetchLink) ? fetchLink : normalizedFetchLink;
        const isBroken = !checkedLinks.get(linkKey);
        if (isBroken) {
          addBrokenLink(brokenLinksMap, documentPath, link, distPath);
        }
        return;
      }

      let isBroken = false;

      if (fetchLink.startsWith('/') && distPath) {
        // Internal link in build mode, check if file exists
        // Decode URI components to handle spaces and special characters
        const decodedPath = decodeURIComponent(fetchLink);

        // Potential file paths to check
        const possiblePaths = [
          path.join(distPath, decodedPath),
          path.join(distPath, decodedPath, 'index.html'),
          path.join(distPath, `${decodedPath}.html`),
        ];

        // For files with spaces or special characters, also check the encoded path
        if (decodedPath !== fetchLink) {
          possiblePaths.push(
            path.join(distPath, fetchLink),
            path.join(distPath, fetchLink, 'index.html'),
            path.join(distPath, `${fetchLink}.html`)
          );
        }

        // Check if any of the possible paths exist
        if (!possiblePaths.some((p) => {
          try {
            return fs.existsSync(p);
          } catch (err) {
            // Handle invalid paths that might cause existsSync to fail
            logger?.debug?.(`Error checking path ${p}: ${err.message}`);
            return false;
          }
        })) {
          isBroken = true;
        }
      } else if (checkExternalLinks) {
        // External link, check via HTTP request. Retry 3 times if ECONNRESET
        let retries = 0;
        while (retries < 3) {
          try {
            const response = await fetch(fetchLink, { method: 'GET' });
            isBroken = !response.ok;
            if (isBroken) {
              logger?.error(`${response.status} Error fetching ${fetchLink}`);
            }
            break;
          } catch (error) {
            isBroken = true;
            let statusCodeNumber = error.errno == 'ENOTFOUND' ? 404 : (error.errno);
            logger?.error(`${statusCodeNumber} error fetching ${fetchLink}`);
            if (error.errno === 'ECONNRESET') {
              retries++;
              continue;
            }
            break;
          }
        }
      }

      // Cache the link's validity - both encoded and decoded versions
      const linkIsValid = !isBroken;
      checkedLinks.set(fetchLink, linkIsValid);
      checkedLinks.set(absoluteLink, linkIsValid);

      // Also cache the decoded versions to handle URL-encoded characters
      if (fetchLink.includes('%')) {
        checkedLinks.set(decodeURIComponent(fetchLink), linkIsValid);
      }
      if (absoluteLink.includes('%')) {
        checkedLinks.set(decodeURIComponent(absoluteLink), linkIsValid);
      }

      if (isBroken) {
        addBrokenLink(brokenLinksMap, documentPath, link, distPath);
      }
    })
  );

  await Promise.all(checkLinkPromises);
}

/**
 * Check if a URL should be validated
 *
 * @param {string} url - URL to check
 * @returns {boolean} - Whether the URL should be validated
 */
function isValidUrl(url) {
  // Skip mailto:, tel:, javascript:, and empty links
  if (
    url.startsWith('mailto:') ||
    url.startsWith('tel:') ||
    url.startsWith('javascript:') ||
    url.startsWith('#') ||
    url.trim() === ''
  ) {
    return false;
  }
  return true;
}


/**
 * Add a broken link to the broken links map
 *
 * @param {Map} brokenLinksMap - Map to store broken links
 * @param {string} documentPath - Path to the document
 * @param {string} brokenLink - Broken link URL
 * @param {string} distPath - Path to the build output directory
 */
function addBrokenLink(brokenLinksMap, documentPath, brokenLink, distPath) {
  // Normalize document path using the imported helper
  let normalizedPath = normalizeHtmlFilePath(documentPath, distPath);

  if (!brokenLinksMap.has(brokenLink)) {
    brokenLinksMap.set(brokenLink, new Set());
  }
  brokenLinksMap.get(brokenLink).add(normalizedPath);
}

/**
 * Find raw, unobfuscated email addresses in text
 * 
 * @param {string} text - Text content to search
 * @param {Array} allowlist - List of allowed email addresses to ignore
 * @returns {Array} - List of found email addresses
 */
function findRawEmails(text, allowlist = []) {
  const emails = [];
  const regex = new RegExp(EMAIL_REGEX, 'g');
  let match;
  
  // Find all emails using regex
  while ((match = regex.exec(text)) !== null) {
    const email = match[0];
    
    // Skip if in allowlist
    if (allowlist.includes(email)) {
      continue;
    }
    
    // Skip if obfuscated
    const surroundingText = getSurroundingText(text, match.index, email.length);
    if (isObfuscated(surroundingText)) {
      continue;
    }
    
    emails.push(email);
  }
  
  return emails;
}

/**
 * Get text surrounding a match for context
 * 
 * @param {string} text - Full text content
 * @param {number} index - Start index of match
 * @param {number} length - Length of match
 * @param {number} contextSize - Number of characters to include before and after
 * @returns {string} - Text with surrounding context
 */
function getSurroundingText(text, index, length, contextSize = 30) {
  const start = Math.max(0, index - contextSize);
  const end = Math.min(text.length, index + length + contextSize);
  return text.substring(start, end);
}

/**
 * Check if text appears to be obfuscated
 * 
 * @param {string} text - Text to check for obfuscation patterns
 * @returns {boolean} - True if text contains obfuscation patterns
 */
function isObfuscated(text) {
  // Check for common obfuscation patterns
  return GENERIC_OBFUSCATION_PATTERNS.some(pattern => 
    text.toLowerCase().includes(pattern.toLowerCase())
  );
}