/**
 * Report Formatters Module
 * 
 * This module handles different output formats for the SEO checker reports:
 * - Markdown (.log or .md) - Human readable format with nice formatting
 * - CSV (.csv) - For spreadsheet import and analysis
 * - JSON (.json) - For programmatic usage and data processing
 */

import { formatMarkdown } from './markdown-formatter.js';
import { formatCSV } from './csv-formatter.js';
import { formatJSON } from './json-formatter.js';
import path from 'path';

// Output format constants
export const OUTPUT_FORMATS = {
  MARKDOWN: 'markdown',
  CSV: 'csv',
  JSON: 'json'
};

/**
 * Get the appropriate formatter based on file extension or format option
 * 
 * @param {string} filePath - The output file path
 * @param {string} [format] - Optional explicit format override
 * @returns {Function} The formatter function to use
 */
export function getFormatter(filePath, format) {
  // If explicit format is provided, use it
  if (format) {
    return getFormatterByName(format);
  }
  
  // Otherwise, determine from file extension
  const extension = path.extname(filePath).toLowerCase();
  
  switch (extension) {
    case '.json':
      return formatJSON;
    case '.csv':
      return formatCSV;
    case '.md':
    case '.log':
    default:
      return formatMarkdown;
  }
}

/**
 * Get formatter by name
 * 
 * @param {string} format - Format name (markdown, csv, json)
 * @returns {Function} The formatter function
 */
function getFormatterByName(format) {
  switch (format.toLowerCase()) {
    case OUTPUT_FORMATS.JSON:
      return formatJSON;
    case OUTPUT_FORMATS.CSV:
      return formatCSV;
    case OUTPUT_FORMATS.MARKDOWN:
    default:
      return formatMarkdown;
  }
}

/**
 * Format a report using the appropriate formatter
 * 
 * @param {Map} brokenLinksMap - Map of broken links to affected pages
 * @param {Map} seoIssuesMap - Map of SEO issues by category
 * @param {Object} options - Formatting options
 * @param {string} options.filePath - Path where the report will be saved
 * @param {string} [options.format] - Optional explicit format override
 * @param {number} options.startTime - Start time of the scan in milliseconds
 * @returns {string} The formatted report content
 */
export function formatReport(brokenLinksMap, seoIssuesMap, options) {
  const formatter = getFormatter(options.filePath, options.format);
  return formatter(brokenLinksMap, seoIssuesMap, options);
}