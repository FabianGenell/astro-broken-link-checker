/**
 * Central definition of phase names and constants
 * 
 * This provides a single source of truth for phase identifiers
 * and their corresponding display names throughout the application.
 */

/**
 * Phase identifier type
 */
export type PhaseId = 'foundation' | 'metadata' | 'accessibility' | 'performance' | 'crawlability' | 'ai_detection';

/**
 * Phase identifiers - used as keys in config and internal references
 */
export const PHASE_IDS: Record<string, PhaseId> = {
  FOUNDATION: 'foundation',
  METADATA: 'metadata',
  ACCESSIBILITY: 'accessibility',
  PERFORMANCE: 'performance',
  CRAWLABILITY: 'crawlability',
  AI_DETECTION: 'ai_detection'
};

/**
 * Category identifier type
 */
export type CategoryId = 
  | 'broken_links'
  | 'privacy: exposed email'
  | 'metadata: missing elements'
  | 'metadata: empty elements'
  | 'metadata: duplicates'
  | 'metadata: canonical'
  | 'semantic: heading structure'
  | 'semantic: language'
  | 'accessibility: missing alt'
  | 'accessibility: empty alt'
  | 'accessibility: unlabeled interactive'
  | 'accessibility: generic link text'
  | 'performance: layout shift'
  | 'performance: render blocking'
  | 'performance: inline code'
  | 'technical: mobile friendly'
  | 'crawlability: missing robots.txt'
  | 'crawlability: missing sitemap'
  | 'crawlability: noindex'
  | 'crawlability: nofollow'
  | 'crawlability: noarchive'
  | 'linking: too few links'
  | 'linking: too many links'
  | 'linking: nofollow internal'
  | 'content: potential ai text';

/**
 * Category identifiers - use these for consistent issue categorization
 */
export const CATEGORIES: Record<string, CategoryId> = {
  // Foundation phase categories
  BROKEN_LINKS: 'broken_links',
  PRIVACY_EMAIL: 'privacy: exposed email',
  
  // Metadata phase categories
  META_MISSING: 'metadata: missing elements',
  META_EMPTY: 'metadata: empty elements',
  META_DUPLICATES: 'metadata: duplicates',
  META_CANONICAL: 'metadata: canonical',
  SEMANTIC_HEADINGS: 'semantic: heading structure',
  SEMANTIC_LANGUAGE: 'semantic: language',
  
  // Accessibility phase categories
  A11Y_ALT_MISSING: 'accessibility: missing alt',
  A11Y_ALT_EMPTY: 'accessibility: empty alt',
  A11Y_INTERACTIVE: 'accessibility: unlabeled interactive',
  A11Y_LINK_TEXT: 'accessibility: generic link text',
  
  // Performance phase categories
  PERF_LAYOUT_SHIFT: 'performance: layout shift',
  PERF_RENDER_BLOCKING: 'performance: render blocking',
  PERF_INLINE_CODE: 'performance: inline code',
  TECH_MOBILE: 'technical: mobile friendly',
  
  // Crawlability phase categories
  CRAWL_ROBOTS_TXT: 'crawlability: missing robots.txt',
  CRAWL_SITEMAP: 'crawlability: missing sitemap',
  CRAWL_NOINDEX: 'crawlability: noindex',
  CRAWL_NOFOLLOW: 'crawlability: nofollow',
  CRAWL_NOARCHIVE: 'crawlability: noarchive',
  LINK_TOO_FEW: 'linking: too few links',
  LINK_TOO_MANY: 'linking: too many links',
  LINK_NOFOLLOW: 'linking: nofollow internal',

  // AI Detection phase categories
  AI_CONTENT: 'content: potential ai text'
};

/**
 * Formatting for categories in reports
 */
export const CATEGORY_FORMATTING: Record<CategoryId, string> = {
  'broken_links': '🔗 Broken Links',
  'privacy: exposed email': '🔒 Privacy: Exposed Email Addresses',
  'metadata: missing elements': '📄 Metadata: Missing Elements',
  'metadata: empty elements': '📄 Metadata: Empty Elements',
  'metadata: duplicates': '🔄 Metadata: Duplicates Across Pages',
  'metadata: canonical': '🔗 Metadata: Canonical Link Issues',
  'semantic: heading structure': '🏗️ Semantic: Heading Structure Issues',
  'semantic: language': '🌐 Semantic: Language Attribute Issues',
  'accessibility: missing alt': '🖼️ Accessibility: Missing Image Alternatives',
  'accessibility: empty alt': '🖼️ Accessibility: Empty Alt Attributes',
  'accessibility: unlabeled interactive': '🔘 Accessibility: Unlabeled Interactive Elements',
  'accessibility: generic link text': '🔗 Accessibility: Generic Link Text',
  'performance: layout shift': '📏 Performance: Layout Shift Prevention',
  'performance: render blocking': '⚡ Performance: Render-Blocking Resources',
  'performance: inline code': '📦 Performance: Excessive Inline Code',
  'technical: mobile friendly': '📱 Technical: Mobile-friendly Configuration',
  'crawlability: missing robots.txt': '🤖 Crawlability: Missing Robots.txt',
  'crawlability: missing sitemap': '🗺️ Crawlability: Missing Sitemap',
  'crawlability: noindex': '🚫 Crawlability: Indexing Blocked',
  'crawlability: nofollow': '🔍 Crawlability: Link Following Blocked',
  'crawlability: noarchive': '💾 Crawlability: Archiving Blocked',
  'linking: too few links': '🔗 Linking: Too Few Internal Links',
  'linking: too many links': '🔗 Linking: Too Many Internal Links',
  'linking: nofollow internal': '🔗 Linking: Nofollow on Internal Links',
  'content: potential ai text': '🤖 Content: Potentially AI-Generated Text'
};