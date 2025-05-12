// Phase 2: Metadata & Semantic Structure
// - Check for presence of <title> and <meta name="description">
// - Detect duplicates across files
// - Ensure each page has a <h1> tag
// - Warn if multiple <h1> tags
// - Validate <html lang=""> exists and is non-empty
// - Validate <link rel="canonical"> exists and points to current page (optional)

import { parse } from 'node-html-parser';
import { normalizeHtmlFilePath } from './utils.js';

// Keep track of duplicate metadata across files
const metadataMap = {
  titles: new Map(), // title -> Set of pages with this title
  descriptions: new Map(), // description -> Set of pages with this description
};

export async function checkPhase2(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {}
) {
  const root = parse(htmlContent);
  const normalizedPath = normalizeDocPath(documentPath, distPath);
  
  // Check <title> tag
  checkTitle(root, issuesMap, normalizedPath);
  
  // Check <meta name="description"> tag
  checkDescription(root, issuesMap, normalizedPath);
  
  // Check heading structure (<h1> tags)
  checkHeadingStructure(root, issuesMap, normalizedPath);
  
  // Check <html lang=""> attribute
  checkLangAttribute(root, issuesMap, normalizedPath);
  
  // Check <link rel="canonical"> (if configured)
  if (options.checkCanonical !== false) {
    checkCanonicalLink(root, issuesMap, normalizedPath, baseUrl);
  }
}

function checkTitle(root, issuesMap, documentPath) {
  const titleElement = root.querySelector('title');
  
  // Check if title exists
  if (!titleElement) {
    addIssue(
      issuesMap,
      documentPath,
      'Missing <title> tag',
      'metadata: missing elements'
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
      'metadata: empty elements'
    );
    return;
  }
  
  // Check for duplicate titles across pages
  if (!metadataMap.titles.has(titleText)) {
    metadataMap.titles.set(titleText, new Set());
  }
  
  metadataMap.titles.get(titleText).add(documentPath);
  
  // If this title appears on multiple pages, report as duplicate
  if (metadataMap.titles.get(titleText).size > 1) {
    // Get all pages with this title
    const duplicatePages = Array.from(metadataMap.titles.get(titleText))
      .filter(path => path !== documentPath) // Exclude current page
      .join(', ');
    
    addIssue(
      issuesMap,
      documentPath,
      `Duplicate title "${titleText}" (also used on: ${duplicatePages})`,
      'metadata: duplicates'
    );
  }
}

function checkDescription(root, issuesMap, documentPath) {
  const descriptionElement = root.querySelector('meta[name="description"]');
  
  // Check if description exists
  if (!descriptionElement) {
    addIssue(
      issuesMap,
      documentPath,
      'Missing <meta name="description"> tag',
      'metadata: missing elements'
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
      'metadata: empty elements'
    );
    return;
  }
  
  // Check for duplicate descriptions across pages
  if (!metadataMap.descriptions.has(descriptionText)) {
    metadataMap.descriptions.set(descriptionText, new Set());
  }
  
  metadataMap.descriptions.get(descriptionText).add(documentPath);
  
  // If this description appears on multiple pages, report as duplicate
  if (metadataMap.descriptions.get(descriptionText).size > 1) {
    // Get all pages with this description
    const duplicatePages = Array.from(metadataMap.descriptions.get(descriptionText))
      .filter(path => path !== documentPath) // Exclude current page
      .join(', ');
    
    addIssue(
      issuesMap,
      documentPath,
      `Duplicate meta description (also used on: ${duplicatePages})`,
      'metadata: duplicates'
    );
  }
}

function checkHeadingStructure(root, issuesMap, documentPath) {
  const h1Elements = root.querySelectorAll('h1');
  
  // Check if h1 exists
  if (h1Elements.length === 0) {
    addIssue(
      issuesMap,
      documentPath,
      'Missing <h1> tag',
      'semantic: heading structure'
    );
    return;
  }
  
  // Check if multiple h1 tags
  if (h1Elements.length > 1) {
    addIssue(
      issuesMap,
      documentPath,
      `Multiple <h1> tags (${h1Elements.length} found)`,
      'semantic: heading structure'
    );
  }
  
  // Check for empty h1 tags
  for (const h1 of h1Elements) {
    if (!h1.textContent.trim()) {
      addIssue(
        issuesMap,
        documentPath,
        'Empty <h1> tag',
        'semantic: heading structure'
      );
      break;
    }
  }
}

function checkLangAttribute(root, issuesMap, documentPath) {
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
      'semantic: language'
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
      'semantic: language'
    );
  }
}

function checkCanonicalLink(root, issuesMap, documentPath, baseUrl) {
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
      'metadata: canonical'
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
      if (normalizedCanonical !== normalizedBase) {
        addIssue(
          issuesMap,
          documentPath,
          `Canonical link (${canonicalHref}) doesn't point to current page (${baseUrl})`,
          'metadata: canonical'
        );
      }
    }
    // For absolute URLs, we can't verify without knowing the site's domain
  } catch (error) {
    addIssue(
      issuesMap,
      documentPath,
      `Invalid canonical URL: ${canonicalHref}`,
      'metadata: canonical'
    );
  }
}

function normalizeDocPath(docPath, distPath) {
  return normalizeHtmlFilePath(docPath, distPath);
}

function addIssue(issuesMap, documentPath, issue, category) {
  // Create category if it doesn't exist
  if (!issuesMap.has(category)) {
    issuesMap.set(category, new Map());
  }
  
  const categoryMap = issuesMap.get(category);
  
  // Create issue if it doesn't exist
  if (!categoryMap.has(issue)) {
    categoryMap.set(issue, new Set());
  }
  
  // Add document to the issue
  categoryMap.get(issue).add(documentPath);
}