/**
 * Accessibility & UX Flags Phase
 * 
 * This phase checks for accessibility issues in HTML content:
 * - Missing or empty alt attributes on images
 * - Interactive elements (buttons, links) without accessible text
 * - Generic, non-descriptive link text
 */

import { parse } from 'node-html-parser';
import { CATEGORIES } from './types.js';
import { addIssue } from './utils.js';

// Generic link texts to flag as non-descriptive
const GENERIC_LINK_TEXTS = [
  'click here', 
  'read more', 
  'learn more', 
  'more info', 
  'details', 
  'here', 
  'this link',
  'this page',
  'continue',
  'continue reading',
  'view',
  'view more',
  'go'
];

/**
 * Main handler for Accessibility & UX Flags phase
 * 
 * @param {string} htmlContent - Raw HTML content to analyze
 * @param {Map} issuesMap - Map to store found issues
 * @param {string} baseUrl - Base URL for the document
 * @param {string} documentPath - Path to the HTML file
 * @param {string} distPath - Path to the build output directory
 * @param {Object} options - Configuration options
 */
export async function checkAccessibilityPhase(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {}
) {
  const root = parse(htmlContent);

  // Check for images without alt attributes
  checkImagesWithoutAlt(root, issuesMap, documentPath, distPath, options);

  // Check for empty interactive elements (buttons, links)
  checkEmptyInteractiveElements(root, issuesMap, documentPath, distPath, options);

  // Check for generic, non-descriptive link text
  checkGenericLinkText(root, issuesMap, documentPath, distPath, options);
}

/**
 * Check for images missing alt attributes or with empty alt attributes
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 * @param {Object} options - Configuration options
 */
function checkImagesWithoutAlt(root, issuesMap, documentPath, distPath, options = {}) {
  const allImages = root.querySelectorAll('img');

  for (const img of allImages) {
    // Collect element attributes
    const src = img.getAttribute('src') || '';
    const width = img.getAttribute('width') || '';
    const height = img.getAttribute('height') || '';
    const className = img.getAttribute('class') || '';

    // Build element attributes for detailed reporting
    const attributes = {
      src
    };
    if (width) attributes.width = width;
    if (height) attributes.height = height;
    if (className) attributes.class = className;

    // Build element info
    const elementInfo = {
      html: img.outerHTML,
      attributes,
      selector: `img[src="${src}"]`
    };

    // Check if alt attribute exists
    if (!img.hasAttribute('alt')) {
      let issueDesc = 'Missing alt attribute on <img>';

      addIssue(
        issuesMap,
        documentPath,
        issueDesc,
        CATEGORIES.A11Y_ALT_MISSING,
        distPath,
        elementInfo
      );
    }
    // Check for empty alt when it shouldn't be empty
    // Note: Empty alt is valid for decorative images, but we might flag it anyway
    // and let the user decide if it's appropriate
    else if (img.getAttribute('alt').trim() === '' && !options.ignoreEmptyAlt) {
      // Add alt to attributes for reporting
      attributes.alt = '';

      addIssue(
        issuesMap,
        documentPath,
        'Empty alt attribute on <img>',
        CATEGORIES.A11Y_ALT_EMPTY,
        distPath,
        elementInfo
      );
    }
  }
}

/**
 * Check for interactive elements without accessible text
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 * @param {Object} options - Configuration options
 */
function checkEmptyInteractiveElements(root, issuesMap, documentPath, distPath, options = {}) {
  // Check buttons with no text content and no aria-label
  const buttons = root.querySelectorAll('button');
  for (const button of buttons) {
    const buttonText = button.textContent.trim();
    const ariaLabel = button.getAttribute('aria-label');
    const ariaLabelledBy = button.getAttribute('aria-labelledby');
    const id = button.getAttribute('id') || '';
    const className = button.getAttribute('class') || '';
    const type = button.getAttribute('type') || '';

    // Build element attributes for detailed reporting
    const attributes = {};
    if (id) attributes.id = id;
    if (className) attributes.class = className;
    if (type) attributes.type = type;
    if (ariaLabel) attributes['aria-label'] = ariaLabel;
    if (ariaLabelledBy) attributes['aria-labelledby'] = ariaLabelledBy;

    // A button should have either text content, aria-label, or aria-labelledby
    if ((!buttonText || buttonText === '') &&
        (!ariaLabel || ariaLabel.trim() === '') &&
        (!ariaLabelledBy || ariaLabelledBy.trim() === '')) {

      // Create selector based on available attributes
      let selector = 'button';
      if (id) selector = `button#${id}`;
      else if (className) selector = `button.${className.split(' ')[0]}`;
      else if (type) selector = `button[type="${type}"]`;

      const elementInfo = {
        html: button.outerHTML,
        attributes,
        selector
      };

      addIssue(
        issuesMap,
        documentPath,
        'Empty button without accessible text',
        CATEGORIES.A11Y_INTERACTIVE,
        distPath,
        elementInfo
      );
    }
  }

  // Check links (<a> tags) with no text content and no aria-label
  const links = root.querySelectorAll('a');
  for (const link of links) {
    const linkText = link.textContent.trim();
    const ariaLabel = link.getAttribute('aria-label');
    const ariaLabelledBy = link.getAttribute('aria-labelledby');
    const href = link.getAttribute('href') || '';
    const id = link.getAttribute('id') || '';
    const className = link.getAttribute('class') || '';

    // Skip links that are fragments only, as they're often controls
    if (href.startsWith('#') && href.length > 1) {
      continue;
    }

    // Build element attributes for detailed reporting
    const attributes = {
      href
    };
    if (id) attributes.id = id;
    if (className) attributes.class = className;
    if (ariaLabel) attributes['aria-label'] = ariaLabel;
    if (ariaLabelledBy) attributes['aria-labelledby'] = ariaLabelledBy;

    // A link should have either text content, aria-label, or aria-labelledby
    if ((!linkText || linkText === '') &&
        (!ariaLabel || ariaLabel.trim() === '') &&
        (!ariaLabelledBy || ariaLabelledBy.trim() === '')) {

      // Create selector based on available attributes
      let selector = `a[href="${href}"]`;
      if (id) selector = `a#${id}`;

      const elementInfo = {
        html: link.outerHTML,
        attributes,
        selector
      };

      addIssue(
        issuesMap,
        documentPath,
        'Empty link without accessible text',
        CATEGORIES.A11Y_INTERACTIVE,
        distPath,
        elementInfo
      );
    }
  }
}

/**
 * Check for generic, non-descriptive link text
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 * @param {Object} options - Configuration options
 */
function checkGenericLinkText(root, issuesMap, documentPath, distPath, options = {}) {
  const links = root.querySelectorAll('a');

  for (const link of links) {
    const linkText = link.textContent.trim().toLowerCase();
    const href = link.getAttribute('href') || '';
    const id = link.getAttribute('id') || '';
    const className = link.getAttribute('class') || '';
    const ariaLabel = link.getAttribute('aria-label');
    const ariaLabelledBy = link.getAttribute('aria-labelledby');

    // Skip links with no text or empty href
    if (!linkText || !href) {
      continue;
    }

    // Check if the link text is in our list of generic texts
    const isGeneric = GENERIC_LINK_TEXTS.some(genericText =>
      linkText === genericText ||
      linkText.includes(genericText)
    );

    if (isGeneric) {
      // Build element attributes for detailed reporting
      const attributes = {
        href
      };
      if (id) attributes.id = id;
      if (className) attributes.class = className;
      if (ariaLabel) attributes['aria-label'] = ariaLabel;
      if (ariaLabelledBy) attributes['aria-labelledby'] = ariaLabelledBy;

      // Create selector based on available attributes
      let selector = `a[href="${href}"]`;
      if (id) selector = `a#${id}`;

      const elementInfo = {
        html: link.outerHTML,
        attributes,
        selector
      };

      // Find which generic text pattern matched
      const matchedPattern = GENERIC_LINK_TEXTS.find(genericText =>
        linkText === genericText || linkText.includes(genericText)
      );

      addIssue(
        issuesMap,
        documentPath,
        `Generic link text "${linkText}" (matches pattern "${matchedPattern}")`,
        CATEGORIES.A11Y_LINK_TEXT,
        distPath,
        elementInfo
      );
    }
  }
}