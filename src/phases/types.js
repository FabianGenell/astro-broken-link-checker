/**
 * Central definition of phase names and constants
 * 
 * This provides a single source of truth for phase identifiers
 * and their corresponding display names throughout the application.
 */

// Phase identifiers - used as keys in config and internal references
export const PHASE_IDS = {
  FOUNDATION: 'foundation',
  METADATA: 'metadata',
  ACCESSIBILITY: 'accessibility',
  PERFORMANCE: 'performance',
  CRAWLABILITY: 'crawlability',
  AI_DETECTION: 'ai_detection'
};

// Category identifiers - use these for consistent issue categorization
export const CATEGORIES = {
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

// Formatting for categories in reports
export const CATEGORY_FORMATTING = {
  [CATEGORIES.PRIVACY_EMAIL]: '🔒 Privacy: Exposed Email Addresses',
  [CATEGORIES.META_MISSING]: '📄 Metadata: Missing Elements',
  [CATEGORIES.META_EMPTY]: '📄 Metadata: Empty Elements',
  [CATEGORIES.META_DUPLICATES]: '🔄 Metadata: Duplicates Across Pages',
  [CATEGORIES.SEMANTIC_HEADINGS]: '🏗️ Semantic: Heading Structure Issues',
  [CATEGORIES.SEMANTIC_LANGUAGE]: '🌐 Semantic: Language Attribute Issues',
  [CATEGORIES.META_CANONICAL]: '🔗 Metadata: Canonical Link Issues',
  [CATEGORIES.A11Y_ALT_MISSING]: '🖼️ Accessibility: Missing Image Alternatives',
  [CATEGORIES.A11Y_ALT_EMPTY]: '🖼️ Accessibility: Empty Alt Attributes',
  [CATEGORIES.A11Y_INTERACTIVE]: '🔘 Accessibility: Unlabeled Interactive Elements',
  [CATEGORIES.A11Y_LINK_TEXT]: '🔗 Accessibility: Generic Link Text',
  [CATEGORIES.PERF_LAYOUT_SHIFT]: '📏 Performance: Layout Shift Prevention',
  [CATEGORIES.PERF_RENDER_BLOCKING]: '⚡ Performance: Render-Blocking Resources',
  [CATEGORIES.PERF_INLINE_CODE]: '📦 Performance: Excessive Inline Code',
  [CATEGORIES.TECH_MOBILE]: '📱 Technical: Mobile-friendly Configuration',
  [CATEGORIES.CRAWL_ROBOTS_TXT]: '🤖 Crawlability: Missing Robots.txt',
  [CATEGORIES.CRAWL_SITEMAP]: '🗺️ Crawlability: Missing Sitemap',
  [CATEGORIES.CRAWL_NOINDEX]: '🚫 Crawlability: Indexing Blocked',
  [CATEGORIES.CRAWL_NOFOLLOW]: '🔍 Crawlability: Link Following Blocked',
  [CATEGORIES.CRAWL_NOARCHIVE]: '💾 Crawlability: Archiving Blocked',
  [CATEGORIES.LINK_TOO_FEW]: '🔗 Linking: Too Few Internal Links',
  [CATEGORIES.LINK_TOO_MANY]: '🔗 Linking: Too Many Internal Links',
  [CATEGORIES.LINK_NOFOLLOW]: '🔗 Linking: Nofollow on Internal Links',
  [CATEGORIES.AI_CONTENT]: '🤖 Content: Potentially AI-Generated Text'
};