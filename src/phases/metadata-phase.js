/**
 * Metadata & Semantic Structure Phase
 * 
 * This phase checks for proper metadata and semantic structure in HTML:
 * - Presence and content of <title> and <meta name="description">
 * - Duplicate titles and descriptions across files
 * - Proper heading structure with <h1> tags
 * - Language attribute on the <html> tag
 * - Canonical link validation
 */

import { parse } from 'node-html-parser';
import { CATEGORIES } from './types.js';
import { addIssue } from './utils.js';

// Keep track of duplicate metadata across files
const metadataMap = {
  titles: new Map(), // title -> Set of pages with this title
  descriptions: new Map(), // description -> Set of pages with this description
};

/**
 * Main handler for Metadata & Semantic Structure phase
 * 
 * @param {string} htmlContent - Raw HTML content to analyze
 * @param {Map} issuesMap - Map to store found issues
 * @param {string} baseUrl - Base URL for the document
 * @param {string} documentPath - Path to the HTML file
 * @param {string} distPath - Path to the build output directory
 * @param {Object} options - Configuration options
 */
export async function checkMetadataPhase(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {}
) {
  const root = parse(htmlContent);
  
  // Check <title> tag
  checkTitle(root, issuesMap, documentPath, distPath);
  
  // Check <meta name="description"> tag
  checkDescription(root, issuesMap, documentPath, distPath);
  
  // Check heading structure (<h1> tags)
  checkHeadingStructure(root, issuesMap, documentPath, distPath);
  
  // Check <html lang=""> attribute
  checkLangAttribute(root, issuesMap, documentPath, distPath);
  
  // Check <link rel="canonical"> (if configured)
  if (options.checkCanonical !== false) {
    checkCanonicalLink(root, issuesMap, documentPath, distPath, baseUrl);
  }
}

/**
 * Check for the presence and uniqueness of the title tag
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 */
function checkTitle(root, issuesMap, documentPath, distPath) {
  const titleElement = root.querySelector('title');
  
  // Check if title exists
  if (!titleElement) {
    addIssue(
      issuesMap,
      documentPath,
      'Missing <title> tag',
      CATEGORIES.META_MISSING,
      distPath
    );
    return;
  }
  
  // Check if title has content
  const titleText = titleElement.textContent.trim();
  if (!titleText) {
    addIssue(
      issuesMap,
      documentPath,
      'Empty <title> tag',
      CATEGORIES.META_EMPTY,
      distPath
    );
    return;
  }
  
  // Check for duplicate titles across pages
  if (!metadataMap.titles.has(titleText)) {
    metadataMap.titles.set(titleText, new Set());
  }
  
  // Add this document to the set of documents with this title
  const normalizedPath = documentPath;
  metadataMap.titles.get(titleText).add(normalizedPath);
  
  // If this title appears on multiple pages, report as duplicate
  if (metadataMap.titles.get(titleText).size > 1) {
    // Get all pages with this title except the current page
    const duplicatePages = Array.from(metadataMap.titles.get(titleText))
      .filter(path => path !== normalizedPath);
    
    if (duplicatePages.length > 0) {
      addIssue(
        issuesMap,
        documentPath,
        `Duplicate title "${titleText}" (also used on: ${duplicatePages[0]})`,
        CATEGORIES.META_DUPLICATES,
        distPath
      );
    }
  }
}

/**
 * Check for the presence and uniqueness of meta description
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 */
function checkDescription(root, issuesMap, documentPath, distPath) {
  const descriptionElement = root.querySelector('meta[name="description"]');
  
  // Check if description exists
  if (!descriptionElement) {
    addIssue(
      issuesMap,
      documentPath,
      'Missing <meta name="description"> tag',
      CATEGORIES.META_MISSING,
      distPath
    );
    return;
  }
  
  // Check if description has content
  const descriptionText = descriptionElement.getAttribute('content')?.trim();
  if (!descriptionText) {
    addIssue(
      issuesMap,
      documentPath,
      'Empty meta description',
      CATEGORIES.META_EMPTY,
      distPath
    );
    return;
  }
  
  // Check for duplicate descriptions across pages
  if (!metadataMap.descriptions.has(descriptionText)) {
    metadataMap.descriptions.set(descriptionText, new Set());
  }
  
  // Add this document to the set of documents with this description
  const normalizedPath = documentPath;
  metadataMap.descriptions.get(descriptionText).add(normalizedPath);
  
  // If this description appears on multiple pages, report as duplicate
  if (metadataMap.descriptions.get(descriptionText).size > 1) {
    // Get all pages with this description except the current page
    const duplicatePages = Array.from(metadataMap.descriptions.get(descriptionText))
      .filter(path => path !== normalizedPath);
    
    if (duplicatePages.length > 0) {
      addIssue(
        issuesMap,
        documentPath,
        `Duplicate meta description (also used on: ${duplicatePages[0]})`,
        CATEGORIES.META_DUPLICATES,
        distPath
      );
    }
  }
}

/**
 * Check for proper heading structure
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 */
function checkHeadingStructure(root, issuesMap, documentPath, distPath) {
  const h1Elements = root.querySelectorAll('h1');
  
  // Check if h1 exists
  if (h1Elements.length === 0) {
    addIssue(
      issuesMap,
      documentPath,
      'Missing <h1> tag',
      CATEGORIES.SEMANTIC_HEADINGS,
      distPath
    );
    return;
  }
  
  // Check if multiple h1 tags
  if (h1Elements.length > 1) {
    addIssue(
      issuesMap,
      documentPath,
      `Multiple <h1> tags (${h1Elements.length} found)`,
      CATEGORIES.SEMANTIC_HEADINGS,
      distPath
    );
  }
  
  // Check for empty h1 tags
  for (const h1 of h1Elements) {
    if (!h1.textContent.trim()) {
      addIssue(
        issuesMap,
        documentPath,
        'Empty <h1> tag',
        CATEGORIES.SEMANTIC_HEADINGS,
        distPath
      );
      break;
    }
  }
}

/**
 * Check for language attribute on HTML tag
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 */
function checkLangAttribute(root, issuesMap, documentPath, distPath) {
  const htmlElement = root.querySelector('html');

  // Check if html element exists (should always be true)
  if (!htmlElement) {
    return;
  }

  // Check if lang attribute exists
  if (!htmlElement.hasAttribute('lang')) {
    addIssue(
      issuesMap,
      documentPath,
      'Missing lang attribute on <html> tag',
      CATEGORIES.SEMANTIC_LANGUAGE,
      distPath
    );
    return;
  }

  // Check if lang attribute is empty
  const langAttribute = htmlElement.getAttribute('lang');
  if (!langAttribute || langAttribute.trim() === '') {
    addIssue(
      issuesMap,
      documentPath,
      'Empty lang attribute on <html> tag',
      CATEGORIES.SEMANTIC_LANGUAGE,
      distPath
    );
  }
}

/**
 * Check canonical link for validity
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 * @param {string} baseUrl - Base URL of the document
 */
function checkCanonicalLink(root, issuesMap, documentPath, distPath, baseUrl) {
  const canonicalElement = root.querySelector('link[rel="canonical"]');
  
  // Canonical link is optional, so don't warn if it's missing
  if (!canonicalElement) {
    return;
  }
  
  const canonicalHref = canonicalElement.getAttribute('href');
  if (!canonicalHref) {
    addIssue(
      issuesMap,
      documentPath,
      'Empty href in canonical link',
      CATEGORIES.META_CANONICAL,
      distPath
    );
    return;
  }
  
  // Parse the canonical URL to check if it points to the current page
  try {
    // If it's a relative URL, it should match the current path
    if (canonicalHref.startsWith('/')) {
      const normalizedCanonical = canonicalHref.split('?')[0].split('#')[0];
      const normalizedBase = baseUrl.split('?')[0].split('#')[0];
      
      // If canonical points to a different page, flag it
      if (normalizedCanonical !== normalizedBase && normalizedBase !== '/') {
        addIssue(
          issuesMap,
          documentPath,
          `Canonical link (${canonicalHref}) doesn't point to current page (${baseUrl})`,
          CATEGORIES.META_CANONICAL,
          distPath
        );
      }
    }
    // For absolute URLs, we can't verify without knowing the site's domain
  } catch (error) {
    addIssue(
      issuesMap,
      documentPath,
      `Invalid canonical URL: ${canonicalHref}`,
      CATEGORIES.META_CANONICAL,
      distPath
    );
  }
}