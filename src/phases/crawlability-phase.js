/**
 * Crawlability & Linking Phase
 * 
 * This phase checks for crawlability and linking issues:
 * - Robots meta tags that block indexing or following
 * - Nofollow attributes on internal links
 * - Internal linking structure (too few or too many links)
 * - Missing robots.txt or sitemap.xml files
 * - Invalid robots.txt or sitemap.xml configuration
 */

import { parse } from 'node-html-parser';
import path from 'path';
import fs from 'fs';
import { CATEGORIES } from './types.js';
import { addIssue, isHomepage } from './utils.js';

// Constants for optimal linking
const MIN_RECOMMENDED_INTERNAL_LINKS = 3;
const MAX_RECOMMENDED_INTERNAL_LINKS = 100;

/**
 * Main handler for Crawlability & Linking phase
 * 
 * @param {string} htmlContent - Raw HTML content to analyze
 * @param {Map} issuesMap - Map to store found issues
 * @param {string} baseUrl - Base URL for the document
 * @param {string} documentPath - Path to the HTML file
 * @param {string} distPath - Path to the build output directory
 * @param {Object} options - Configuration options
 */
export async function checkCrawlabilityPhase(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {}
) {
  const root = parse(htmlContent);
  
  // Check for robots meta tags that block indexing
  checkRobotsMetaTags(root, issuesMap, documentPath, distPath, options);
  
  // Check for nofollow links
  checkNofollowLinks(root, issuesMap, documentPath, distPath, options);
  
  // Check internal linking structure
  checkInternalLinkingStructure(root, issuesMap, baseUrl, documentPath, distPath, options);
  
  // Check for robots.txt issues and sitemap.xml if this is the homepage
  if (isHomepage(documentPath, distPath, baseUrl)) {
    await checkRobotsTxt(issuesMap, documentPath, distPath, options);
    await checkSitemapXml(issuesMap, documentPath, distPath, options);
  }
}

/**
 * Check for robots meta tags that affect crawlability
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 * @param {Object} options - Configuration options
 */
function checkRobotsMetaTags(root, issuesMap, documentPath, distPath, options = {}) {
  // Check meta robots tags
  const robotsMeta = root.querySelectorAll('meta[name="robots"], meta[name="googlebot"]');
  
  for (const meta of robotsMeta) {
    const content = meta.getAttribute('content') || '';
    
    // Check for noindex
    if (content.includes('noindex')) {
      addIssue(
        issuesMap,
        documentPath,
        `Page has <meta name="${meta.getAttribute('name')}" content="${content}"> that prevents indexing`,
        CATEGORIES.CRAWL_NOINDEX,
        distPath
      );
    }
    
    // Check for nofollow
    if (content.includes('nofollow')) {
      addIssue(
        issuesMap,
        documentPath,
        `Page has <meta name="${meta.getAttribute('name')}" content="${content}"> that prevents following links`,
        CATEGORIES.CRAWL_NOFOLLOW,
        distPath
      );
    }
    
    // Check for noarchive
    if (content.includes('noarchive')) {
      addIssue(
        issuesMap,
        documentPath,
        `Page has <meta name="${meta.getAttribute('name')}" content="${content}"> that prevents caching`,
        CATEGORIES.CRAWL_NOARCHIVE,
        distPath
      );
    }
  }
}

/**
 * Check for nofollow attributes on internal links
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 * @param {Object} options - Configuration options
 */
function checkNofollowLinks(root, issuesMap, documentPath, distPath, options = {}) {
  // Check for nofollow links
  const links = root.querySelectorAll('a[rel]');
  
  for (const link of links) {
    const rel = link.getAttribute('rel') || '';
    const href = link.getAttribute('href') || '';
    
    // Skip external links
    if (href.startsWith('http') || href.startsWith('//')) {
      continue;
    }
    
    // Check internal links with nofollow
    if (rel.includes('nofollow') && !href.startsWith('#')) {
      addIssue(
        issuesMap,
        documentPath,
        `Internal link <a href="${href}"> has rel="nofollow" which can harm crawlability`,
        CATEGORIES.LINK_NOFOLLOW,
        distPath
      );
    }
  }
}

/**
 * Check the internal linking structure for SEO best practices
 * 
 * @param {Object} root - Parsed HTML root
 * @param {Map} issuesMap - Map to store issues
 * @param {string} baseUrl - Base URL for the document
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 * @param {Object} options - Configuration options
 */
function checkInternalLinkingStructure(root, issuesMap, baseUrl, documentPath, distPath, options = {}) {
  // Get customizable thresholds from options
  const minLinks = options.minInternalLinks || MIN_RECOMMENDED_INTERNAL_LINKS;
  const maxLinks = options.maxInternalLinks || MAX_RECOMMENDED_INTERNAL_LINKS;
  
  // Check for healthy number of internal links
  const allLinks = root.querySelectorAll('a[href]');
  let internalLinkCount = 0;
  
  for (const link of allLinks) {
    const href = link.getAttribute('href') || '';
    
    // Count only internal links to pages (not anchors, not external links)
    if (!href.startsWith('http') && 
        !href.startsWith('//') && 
        !href.startsWith('mailto:') && 
        !href.startsWith('tel:') && 
        href.length > 1) {
      // Skip fragment-only links
      if (href.startsWith('#')) {
        continue;
      }
      
      internalLinkCount++;
    }
  }
  
  // Check if page has too few internal links
  if (internalLinkCount < minLinks) {
    addIssue(
      issuesMap,
      documentPath,
      `Page has only ${internalLinkCount} internal links (recommend at least ${minLinks} for good crawlability)`,
      CATEGORIES.LINK_TOO_FEW,
      distPath
    );
  }
  
  // Check if page has excessive internal links
  if (internalLinkCount > maxLinks) {
    addIssue(
      issuesMap,
      documentPath,
      `Page has ${internalLinkCount} internal links (recommend fewer than ${maxLinks} to avoid link dilution)`,
      CATEGORIES.LINK_TOO_MANY,
      distPath
    );
  }
}

/**
 * Check for robots.txt file and its configuration
 * 
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 * @param {Object} options - Configuration options
 */
async function checkRobotsTxt(issuesMap, documentPath, distPath, options = {}) {
  const robotsPath = path.join(distPath, 'robots.txt');
  
  try {
    if (!fs.existsSync(robotsPath)) {
      addIssue(
        issuesMap,
        documentPath,
        'robots.txt file is missing (recommended for all production sites)',
        CATEGORIES.CRAWL_ROBOTS_TXT,
        distPath
      );
      return;
    }
    
    const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
    
    // Check for disallow all
    if (robotsContent.includes('Disallow: /')) {
      addIssue(
        issuesMap,
        documentPath,
        'robots.txt contains "Disallow: /" which blocks all search engines from crawling the site',
        CATEGORIES.CRAWL_ROBOTS_TXT,
        distPath
      );
    }
    
    // Check for sitemap reference
    if (!robotsContent.toLowerCase().includes('sitemap:')) {
      addIssue(
        issuesMap,
        documentPath,
        'robots.txt does not contain a Sitemap reference (recommended for better crawling)',
        CATEGORIES.CRAWL_ROBOTS_TXT,
        distPath
      );
    }
  } catch (error) {
    // Ignore file read errors
  }
}

/**
 * Check for sitemap.xml file and its validity
 * 
 * @param {Map} issuesMap - Map to store issues
 * @param {string} documentPath - Path to the document
 * @param {string} distPath - Path to the dist directory
 * @param {Object} options - Configuration options
 */
async function checkSitemapXml(issuesMap, documentPath, distPath, options = {}) {
  // Check common sitemap locations
  const sitemapPaths = [
    path.join(distPath, 'sitemap.xml'),
    path.join(distPath, 'sitemap_index.xml'),
    path.join(distPath, 'sitemap', 'sitemap.xml')
  ];
  
  let sitemapExists = false;
  
  for (const sitemapPath of sitemapPaths) {
    if (fs.existsSync(sitemapPath)) {
      sitemapExists = true;
      
      try {
        const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
        
        // Basic validation
        if (!sitemapContent.includes('<urlset') && !sitemapContent.includes('<sitemapindex')) {
          addIssue(
            issuesMap,
            documentPath,
            `Sitemap at ${path.relative(distPath, sitemapPath)} doesn't appear to be valid XML`,
            CATEGORIES.CRAWL_SITEMAP,
            distPath
          );
        }
      } catch (error) {
        // Ignore file read errors
      }
      
      break;
    }
  }
  
  if (!sitemapExists) {
    addIssue(
      issuesMap,
      documentPath,
      'No sitemap.xml file found (recommended for better search engine crawling)',
      CATEGORIES.CRAWL_SITEMAP,
      distPath
    );
  }
}