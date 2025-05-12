// Phase 5: Crawlability & Linking
// - Check for robots.txt issues and robots meta tags
// - Verify proper sitemap.xml
// - Detect and warn about noindex/nofollow tags
// - Identify broken internal link structures (orphaned pages)
// - Find pages with too few or too many internal links
// - Detect redirect chains and loops

import { parse } from 'node-html-parser';
import { normalizeHtmlFilePath } from '../../check-links.js';
import path from 'path';
import fs from 'fs';

// Constants for optimal linking
const MIN_RECOMMENDED_INTERNAL_LINKS = 3;
const MAX_RECOMMENDED_INTERNAL_LINKS = 100;

export async function checkPhase5(
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

function isHomepage(documentPath, distPath, baseUrl) {
  // Determine if the current document is the homepage
  const normalizedPath = normalizeHtmlFilePath(documentPath, distPath);
  return normalizedPath === '/' || normalizedPath === '/index' || normalizedPath === '';
}

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
        'crawlability: noindex',
        distPath
      );
    }
    
    // Check for nofollow
    if (content.includes('nofollow')) {
      addIssue(
        issuesMap,
        documentPath,
        `Page has <meta name="${meta.getAttribute('name')}" content="${content}"> that prevents following links`,
        'crawlability: nofollow',
        distPath
      );
    }
    
    // Check for noarchive
    if (content.includes('noarchive')) {
      addIssue(
        issuesMap,
        documentPath,
        `Page has <meta name="${meta.getAttribute('name')}" content="${content}"> that prevents caching`,
        'crawlability: noarchive',
        distPath
      );
    }
  }
}

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
        'linking: nofollow internal',
        distPath
      );
    }
  }
}

function checkInternalLinkingStructure(root, issuesMap, baseUrl, documentPath, distPath, options = {}) {
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
  if (internalLinkCount < MIN_RECOMMENDED_INTERNAL_LINKS) {
    addIssue(
      issuesMap,
      documentPath,
      `Page has only ${internalLinkCount} internal links (recommend at least ${MIN_RECOMMENDED_INTERNAL_LINKS} for good crawlability)`,
      'linking: too few links',
      distPath
    );
  }
  
  // Check if page has excessive internal links
  if (internalLinkCount > MAX_RECOMMENDED_INTERNAL_LINKS) {
    addIssue(
      issuesMap,
      documentPath,
      `Page has ${internalLinkCount} internal links (recommend fewer than ${MAX_RECOMMENDED_INTERNAL_LINKS} to avoid link dilution)`,
      'linking: too many links',
      distPath
    );
  }
}

async function checkRobotsTxt(issuesMap, documentPath, distPath, options = {}) {
  const robotsPath = path.join(distPath, 'robots.txt');
  
  try {
    if (!fs.existsSync(robotsPath)) {
      addIssue(
        issuesMap,
        documentPath,
        'robots.txt file is missing (recommended for all production sites)',
        'crawlability: missing robots.txt',
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
        'crawlability: blocked by robots.txt',
        distPath
      );
    }
    
    // Check for sitemap reference
    if (!robotsContent.toLowerCase().includes('sitemap:')) {
      addIssue(
        issuesMap,
        documentPath,
        'robots.txt does not contain a Sitemap reference (recommended for better crawling)',
        'crawlability: no sitemap in robots.txt',
        distPath
      );
    }
  } catch (error) {
    // Ignore file read errors
  }
}

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
            'crawlability: invalid sitemap',
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
      'crawlability: missing sitemap',
      distPath
    );
  }
}

function addIssue(issuesMap, documentPath, issue, category, distPath) {
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
  
  // Add document to the issue
  categoryMap.get(issue).add(normalizedPath);
}