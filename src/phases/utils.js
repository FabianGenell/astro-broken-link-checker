/**
 * Shared utilities for SEO checker phases
 */

import path from 'path';

/**
 * Normalize a path for consistent representation
 *
 * @param {string} p - Path to normalize
 * @returns {string} - Normalized path
 */
export function normalizePath(p) {
  p = p.toString();
  // Remove query parameters and fragments
  p = p.split('?')[0].split('#')[0];

  // Remove '/index.html' or '.html' suffixes
  if (p.endsWith('/index.html')) {
    p = p.slice(0, -'index.html'.length);
  } else if (p.endsWith('.html')) {
    p = p.slice(0, -'.html'.length);
  }

  // Ensure leading '/'
  if (!p.startsWith('/')) {
    p = '/' + p;
  }

  return p;
}

/**
 * Normalize a HTML file path relative to the dist path
 *
 * @param {string} filePath - File path to normalize
 * @param {string} distPath - Distribution path for relativity
 * @returns {string} - Normalized path
 */
export function normalizeHtmlFilePath(filePath, distPath = '') {
  return normalizePath(distPath ? path.relative(distPath, filePath) : filePath);
}

/**
 * Adds an issue to the issues map with proper categorization
 *
 * @param {Map} issuesMap - The map to store issues in
 * @param {string} documentPath - Path to the document where the issue was found
 * @param {string} issue - Description of the issue
 * @param {string} category - Category identifier for grouping issues
 * @param {string} distPath - Path to the distribution directory for normalization
 */
export function addIssue(issuesMap, documentPath, issue, category, distPath) {
  // Normalize document path to make it consistent
  const normalizedPath = normalizeHtmlFilePath(documentPath, distPath);

  // Create category if it doesn't exist
  if (!issuesMap.has(category)) {
    issuesMap.set(category, new Map());
  }

  const categoryMap = issuesMap.get(category);

  // Create issue if it doesn't exist
  if (!categoryMap.has(issue)) {
    categoryMap.set(issue, new Set());
  }

  // Add document to the issue's set of affected pages
  categoryMap.get(issue).add(normalizedPath);
}

/**
 * Decode HTML entities in text
 * 
 * @param {string} text - Text that may contain HTML entities
 * @returns {string} - Decoded text
 */
export function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Extract readable text content from HTML
 *
 * @param {Object} root - HTML parser root element
 * @returns {string} - Extracted text content
 */
export function extractTextContent(root) {
  // We can't modify the original root, so we'll work with a filter approach
  // Get all scripts and styles to filter out
  const scripts = root.querySelectorAll('script');
  const styles = root.querySelectorAll('style');

  // Get full text content
  let content = root.textContent;

  // Remove text content from scripts and styles
  for (const script of scripts) {
    content = content.replace(script.textContent, '');
  }

  for (const style of styles) {
    content = content.replace(style.textContent, '');
  }

  // Decode HTML entities
  return decodeHtmlEntities(content);
}

/**
 * Check if a file path appears to be the homepage
 * 
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the distribution directory
 * @param {string} baseUrl - Base URL of the document
 * @returns {boolean} - True if the path represents a homepage
 */
export function isHomepage(documentPath, distPath, baseUrl) {
  const normalizedPath = normalizeHtmlFilePath(documentPath, distPath);
  return normalizedPath === '/' || normalizedPath === '/index' || normalizedPath === '';
}