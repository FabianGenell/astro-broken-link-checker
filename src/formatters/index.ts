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
import { ReportOptions } from '../types/index.js';

/**
 * Formatter function type
 */
export type FormatterFunction = (
  brokenLinksMap: Map<string, Set<string>>,
  seoIssuesMap: Map<string, Map<string, Set<string>>>,
  options: ReportOptions
) => string;

/**
 * Output format constants
 */
export const OUTPUT_FORMATS = {
  MARKDOWN: 'markdown',
  CSV: 'csv',
  JSON: 'json'
} as const;

export type OutputFormat = typeof OUTPUT_FORMATS[keyof typeof OUTPUT_FORMATS];

/**
 * Get the appropriate formatter based on file extension or format option
 * 
 * @param filePath - The output file path
 * @param format - Optional explicit format override
 * @returns The formatter function to use
 */
export function getFormatter(filePath: string, format?: string): FormatterFunction {
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
 * @param format - Format name (markdown, csv, json)
 * @returns The formatter function
 */
function getFormatterByName(format: string): FormatterFunction {
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
 * @param brokenLinksMap - Map of broken links to affected pages
 * @param seoIssuesMap - Map of SEO issues by category
 * @param options - Formatting options
 * @returns The formatted report content
 */
export function formatReport(
  brokenLinksMap: Map<string, Set<string>>,
  seoIssuesMap: Map<string, Map<string, Set<string>>>,
  options: ReportOptions
): string {
  const formatter = getFormatter(options.filePath, options.format);
  return formatter(brokenLinksMap, seoIssuesMap, options);
}