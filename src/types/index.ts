/**
 * Type definitions for Astro SEO Checker
 */

/**
 * Phase identifiers for configuration and reference
 */
export const PHASE_IDS = {
  FOUNDATION: 'foundation',
  METADATA: 'metadata',
  ACCESSIBILITY: 'accessibility',
  PERFORMANCE: 'performance',
  CRAWLABILITY: 'crawlability',
  AI_DETECTION: 'ai_detection'
} as const;

/**
 * Type for Astro Logger
 */
export interface AstroLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug?: (message: string) => void;
}

/**
 * Interface for Astro Config Redirects
 */
export interface AstroRedirect {
  source: string;
  destination: string;
  permanent?: boolean;
}

/**
 * Category Group for report organization
 */
export interface CategoryGroups {
  [key: string]: Array<{
    count: number;
    category: string;
  }>;
}

/**
 * Group emojis for report formatting
 */
export interface GroupEmojis {
  [key: string]: string;
}

/**
 * Configuration options for the Astro SEO Checker integration
 */
export interface AstroSeoCheckerOptions {
  /** Path where the report file will be saved. Extension determines format unless overridden */
  reportFilePath?: string;
  /** Legacy alias for reportFilePath, maintained for backward compatibility */
  logFilePath?: string;
  /** Report format override ('markdown', 'json', 'csv') regardless of file extension */
  reportFormat?: string;
  /** Whether to check external links (significantly slower) */
  checkExternalLinks?: boolean;
  /** Enable detailed logging during the scan process */
  verbose?: boolean;
  
  /** List of email addresses to ignore when checking for exposed emails */
  emailAllowlist?: string[];
  /** Validate the canonical link on each page */
  checkCanonical?: boolean;
  
  /** Enable/disable specific check phases */
  phases?: {
    /** Foundation & Privacy checks */
    foundation?: boolean;
    /** Metadata & Semantic Structure checks */
    metadata?: boolean;
    /** Accessibility & UX Flags checks */
    accessibility?: boolean;
    /** Performance & Technical SEO checks */
    performance?: boolean;
    /** Crawlability & Linking checks */
    crawlability?: boolean;
    /** AI Content Detection checks */
    ai_detection?: boolean;
    [key: string]: boolean | undefined;
  };
  
  /** Don't flag empty alt attributes (for decorative images) */
  ignoreEmptyAlt?: boolean;
  
  /** Enable file size checking for resources */
  checkResourceSizes?: boolean;
  /** Size threshold for images in KB (flags larger images) */
  imageSizeThreshold?: number;
  /** Size threshold for inline scripts in KB (flags larger scripts) */
  inlineScriptThreshold?: number;
  /** Size threshold for inline styles in KB (flags larger styles) */
  inlineStyleThreshold?: number;
  
  /** Minimum recommended internal links per page */
  minInternalLinks?: number;
  /** Maximum recommended internal links per page */
  maxInternalLinks?: number;
  
  /** Score threshold (0-100) for flagging AI content */
  aiDetectionThreshold?: number;
  /** Paths to exclude from AI detection */
  aiDetectionExcludePaths?: string[];

  /** Storage for Astro redirects (populated internally) */
  astroConfigRedirects?: Record<string, AstroRedirect | string>;
}

/**
 * Options for phase runner
 */
export interface PhaseOptions extends AstroSeoCheckerOptions {
  brokenLinksMap: Map<string, Set<string>>;
  checkedLinks: Map<string, boolean>;
  logger?: AstroLogger;
}

/**
 * Report generation options
 */
export interface ReportOptions {
  filePath: string;
  format?: string;
  startTime: number;
}

/**
 * Simplified output format type
 */
export type OutputFormat = 'markdown' | 'json' | 'csv';