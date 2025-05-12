/**
 * Error handling utilities for Astro SEO Checker
 * 
 * This module provides structured error classes and utilities for consistent
 * error handling and user-friendly error messages.
 */

import { AstroLogger } from '../index.js';

/**
 * Base error class for Astro SEO Checker
 */
export class SeoCheckerError extends Error {
  /** Category of the error */
  category: string;
  /** Whether this is fatal to the process */
  fatal: boolean;
  /** Suggested fix for the error */
  suggestion?: string;
  /** Documentation link related to this error */
  docLink?: string;

  /**
   * Create a new SeoChecker error
   * 
   * @param message - Error message
   * @param options - Additional error options
   */
  constructor(message: string, options: {
    category: string;
    fatal?: boolean;
    suggestion?: string;
    docLink?: string;
  }) {
    super(message);
    this.name = 'SeoCheckerError';
    this.category = options.category;
    this.fatal = options.fatal || false;
    this.suggestion = options.suggestion;
    this.docLink = options.docLink;
  }

  /**
   * Format the error for display
   */
  format(): string {
    let formattedError = `❌ SEO Checker ${this.category} Error: ${this.message}`;
    
    if (this.suggestion) {
      formattedError += `\n\n💡 Suggestion: ${this.suggestion}`;
    }
    
    if (this.docLink) {
      formattedError += `\n\n📚 Documentation: ${this.docLink}`;
    }
    
    return formattedError;
  }
}

/**
 * Error for configuration issues
 */
export class ConfigError extends SeoCheckerError {
  constructor(message: string, options: {
    fatal?: boolean;
    suggestion?: string;
    docLink?: string;
  } = {}) {
    super(message, {
      category: 'Configuration',
      ...options
    });
    this.name = 'ConfigError';
  }
}

/**
 * Error for filesystem issues
 */
export class FilesystemError extends SeoCheckerError {
  constructor(message: string, options: {
    fatal?: boolean;
    suggestion?: string;
    docLink?: string;
  } = {}) {
    super(message, {
      category: 'Filesystem',
      ...options
    });
    this.name = 'FilesystemError';
  }
}

/**
 * Error for parsing issues
 */
export class ParsingError extends SeoCheckerError {
  constructor(message: string, options: {
    fatal?: boolean;
    suggestion?: string;
    docLink?: string;
  } = {}) {
    super(message, {
      category: 'Parsing',
      ...options
    });
    this.name = 'ParsingError';
  }
}

/**
 * Error for network issues
 */
export class NetworkError extends SeoCheckerError {
  constructor(message: string, options: {
    fatal?: boolean;
    suggestion?: string;
    docLink?: string;
  } = {}) {
    super(message, {
      category: 'Network',
      ...options
    });
    this.name = 'NetworkError';
  }
}

/**
 * Common error instances with helpful suggestions
 */
export const errors = {
  invalidReportFormat: new ConfigError(
    "Invalid report format specified. Must be 'markdown', 'json', or 'csv'.",
    {
      suggestion: "Use one of the supported formats: 'markdown', 'json', or 'csv'. The format can also be determined from the file extension."
    }
  ),
  
  cannotWriteReport: (filePath: string) => new FilesystemError(
    `Cannot write report to ${filePath}`,
    {
      suggestion: "Make sure the directory exists and you have write permissions. You can try using a different location or creating the directory first."
    }
  ),
  
  invalidHtml: (filePath: string) => new ParsingError(
    `Failed to parse HTML in ${filePath}`,
    {
      suggestion: "Check that the HTML is valid. Common issues include unmatched tags or improperly nested elements."
    }
  ),
  
  externalLinkTimeout: (url: string) => new NetworkError(
    `Timeout when checking external link: ${url}`,
    {
      suggestion: "The server might be slow or unreachable. You can try disabling external link checking or increasing the request timeout."
    }
  ),
  
  phaseExecutionFailed: (phaseName: string, reason: string) => new SeoCheckerError(
    `Failed to execute phase '${phaseName}': ${reason}`,
    {
      category: 'Phase Execution',
      suggestion: "Check the error message for details. This could be due to malformed HTML or an issue with the specific check being performed."
    }
  )
};

/**
 * Handle an error by logging it and optionally exiting
 * 
 * @param error - Error to handle
 * @param logger - Astro logger to use
 * @param exitOnFatal - Whether to exit the process on fatal errors
 */
export function handleError(
  error: Error | SeoCheckerError, 
  logger: AstroLogger,
  exitOnFatal = true
): void {
  // Format the error if it's a SeoCheckerError
  if (error instanceof SeoCheckerError) {
    logger.error(error.format());
    
    // Exit on fatal errors if requested
    if (exitOnFatal && error.fatal) {
      process.exit(1);
    }
  } else {
    // Regular Error
    logger.error(`❌ SEO Checker Error: ${error.message}`);
    
    // Log stack trace in verbose mode
    if (logger.debug) {
      logger.debug(error.stack || '');
    }
  }
}