/**
 * Shared utilities for SEO checker phases
 */

import path from 'path';
import { HTMLElement } from 'node-html-parser';

/**
 * Element information for enhanced issue reporting
 */
export interface ElementInfo {
  /** CSS selector identifying the element */
  selector?: string;
  /** HTML snippet of the problematic element */
  html?: string;
  /** Key attributes of the element */
  attributes?: Record<string, string>;
  /** Line number in the document where the issue occurs */
  line?: number;
}

/**
 * Normalize a path for consistent representation
 *
 * @param p - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(p: string | number): string {
  const pStr = p.toString();
  // Remove query parameters and fragments
  let normalized = pStr.split('?')[0].split('#')[0];

  // Remove '/index.html' or '.html' suffixes
  if (normalized.endsWith('/index.html')) {
    normalized = normalized.slice(0, -'index.html'.length);
  } else if (normalized.endsWith('.html')) {
    normalized = normalized.slice(0, -'.html'.length);
  }

  // Ensure leading '/'
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
}

/**
 * Normalize a HTML file path relative to the dist path
 *
 * @param filePath - File path to normalize
 * @param distPath - Distribution path for relativity
 * @returns Normalized path
 */
export function normalizeHtmlFilePath(filePath: string, distPath = ''): string {
  return normalizePath(distPath ? path.relative(distPath, filePath) : filePath);
}

/**
 * Adds an issue to the issues map with proper categorization
 *
 * @param issuesMap - The map to store issues in
 * @param documentPath - Path to the document where the issue was found
 * @param issue - Description of the issue
 * @param category - Category identifier for grouping issues
 * @param distPath - Path to the distribution directory for normalization
 * @param elementInfo - Optional information about the specific element causing the issue
 */
export function addIssue(
  issuesMap: Map<string, Map<string, Set<string>>>,
  documentPath: string,
  issue: string,
  category: string,
  distPath: string,
  elementInfo: ElementInfo | null = null
): void {
  // Normalize document path to make it consistent
  const normalizedPath = normalizeHtmlFilePath(documentPath, distPath);

  // Create category if it doesn't exist
  if (!issuesMap.has(category)) {
    issuesMap.set(category, new Map());
  }

  const categoryMap = issuesMap.get(category)!;

  // Enhance issue description with element info if provided
  let enhancedIssue = issue;
  if (elementInfo) {
    // Add line number if available
    if (elementInfo.line) {
      enhancedIssue += ` [line: ${elementInfo.line}]`;
    }

    // Add HTML snippet if available (limited to reasonable length)
    if (elementInfo.html) {
      const htmlSnippet = elementInfo.html.length > 100
        ? elementInfo.html.substring(0, 97) + '...'
        : elementInfo.html;
      enhancedIssue += `\nElement: ${htmlSnippet}`;
    }

    // Add key attributes if available
    if (elementInfo.attributes && Object.keys(elementInfo.attributes).length > 0) {
      const attrsStr = Object.entries(elementInfo.attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      if (attrsStr && !enhancedIssue.includes(attrsStr)) {
        enhancedIssue += `\nAttributes: ${attrsStr}`;
      }
    }

    // Add CSS selector if available and not already in the issue description
    if (elementInfo.selector && !enhancedIssue.includes(elementInfo.selector)) {
      enhancedIssue += `\nSelector: ${elementInfo.selector}`;
    }
  }

  // Create issue if it doesn't exist
  if (!categoryMap.has(enhancedIssue)) {
    categoryMap.set(enhancedIssue, new Set());
  }

  // Add document to the issue's set of affected pages
  categoryMap.get(enhancedIssue)!.add(normalizedPath);
}

/**
 * Decode HTML entities in text
 * 
 * @param text - Text that may contain HTML entities
 * @returns Decoded text
 */
export function decodeHtmlEntities(text: string): string {
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
 * @param root - HTML parser root element
 * @returns Extracted text content
 */
export function extractTextContent(root: HTMLElement): string {
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
 * @param documentPath - Path to the document
 * @param distPath - Path to the distribution directory
 * @returns True if the path represents a homepage
 */
export function isHomepage(documentPath: string, distPath: string): boolean {
  const normalizedPath = normalizeHtmlFilePath(documentPath, distPath);
  return normalizedPath === '/' || normalizedPath === '/index' || normalizedPath === '';
}