// Phase 4: Performance & Technical SEO
// - Detect large images (need width/height attributes)
// - Find JavaScript without async/defer attributes
// - Check for render-blocking resources
// - Look for inline CSS and JavaScript
// - Validate mobile viewport settings

import { parse } from 'node-html-parser';
import { normalizeHtmlFilePath } from './utils.js';
import path from 'path';
import fs from 'fs';

// Size thresholds for performance warnings (in KB)
const IMAGE_SIZE_THRESHOLD = 200; // 200KB
const CSS_SIZE_THRESHOLD = 50; // 50KB
const JS_SIZE_THRESHOLD = 100; // 100KB

export async function checkPhase4(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {}
) {
  const root = parse(htmlContent);
  
  // Check for images without width/height attributes
  checkImagesWithoutDimensions(root, issuesMap, documentPath, distPath, options);
  
  // Check for render-blocking resources (JS without async/defer)
  checkRenderBlockingResources(root, issuesMap, documentPath, distPath, options);
  
  // Check for excessive inline code
  checkInlineCode(root, issuesMap, documentPath, distPath, options);
  
  // Check for mobile viewport settings
  checkViewportSettings(root, issuesMap, documentPath, distPath, options);
  
  // Check for large uncompressed resources if enabled
  if (options.checkResourceSizes) {
    await checkResourceSizes(root, issuesMap, documentPath, distPath, options);
  }
}

function checkImagesWithoutDimensions(root, issuesMap, documentPath, distPath, options = {}) {
  const allImages = root.querySelectorAll('img');
  
  for (const img of allImages) {
    const hasWidth = img.hasAttribute('width');
    const hasHeight = img.hasAttribute('height');
    
    // Skip SVGs and tiny images if configured
    const src = img.getAttribute('src') || '';
    if (options.ignoreSmallImages && (src.endsWith('.svg') || src.includes('data:image/svg'))) {
      continue;
    }
    
    // Check if both width and height are present
    if (!hasWidth || !hasHeight) {
      const issueDesc = `<img src="${src}"> missing ${!hasWidth ? 'width' : ''}${(!hasWidth && !hasHeight) ? ' and ' : ''}${!hasHeight ? 'height' : ''} attribute${(!hasWidth && !hasHeight) ? 's' : ''}`;
      
      addIssue(
        issuesMap,
        documentPath,
        issueDesc,
        'performance: layout shift',
        distPath
      );
    }
  }
}

function checkRenderBlockingResources(root, issuesMap, documentPath, distPath, options = {}) {
  // Check for render-blocking scripts
  const scripts = root.querySelectorAll('script[src]');
  
  for (const script of scripts) {
    const isAsync = script.hasAttribute('async');
    const isDefer = script.hasAttribute('defer');
    const src = script.getAttribute('src') || '';
    
    // Skip module scripts (they're deferred by default) and tiny scripts
    if (script.hasAttribute('type') && script.getAttribute('type') === 'module') {
      continue;
    }
    
    // Check if script is render-blocking (no async or defer)
    if (!isAsync && !isDefer) {
      addIssue(
        issuesMap,
        documentPath,
        `Render-blocking script: <script src="${src}"> without async or defer`,
        'performance: render blocking',
        distPath
      );
    }
  }
  
  // Check for render-blocking stylesheets
  const styleLinks = root.querySelectorAll('link[rel="stylesheet"]');
  
  for (const link of styleLinks) {
    const href = link.getAttribute('href') || '';
    
    // Check for media query (print stylesheets aren't render-blocking)
    const media = link.getAttribute('media');
    if (media && (media.includes('print') || media.includes('(max-width') || media.includes('(min-width'))) {
      continue;
    }
    
    addIssue(
      issuesMap,
      documentPath,
      `Render-blocking stylesheet: <link href="${href}">`,
      'performance: render blocking',
      distPath
    );
  }
}

function checkInlineCode(root, issuesMap, documentPath, distPath, options = {}) {
  // Check for inline scripts
  const inlineScripts = root.querySelectorAll('script:not([src])');
  
  for (const script of inlineScripts) {
    const scriptContent = script.text;
    
    // Skip empty scripts and JSON data
    if (!scriptContent || scriptContent.trim().length < 50 || 
        (script.hasAttribute('type') && script.getAttribute('type').includes('json'))) {
      continue;
    }
    
    // Calculate approximate size in KB
    const sizeInKB = Math.round(scriptContent.length / 1024);
    
    if (sizeInKB > (options.inlineScriptThreshold || 2)) {
      addIssue(
        issuesMap,
        documentPath,
        `Large inline script (${sizeInKB}KB) found. Consider moving to external file.`,
        'performance: inline code',
        distPath
      );
    }
  }
  
  // Check for inline styles
  const inlineStyles = root.querySelectorAll('style');
  
  for (const style of inlineStyles) {
    const styleContent = style.text;
    
    // Skip empty styles
    if (!styleContent || styleContent.trim().length < 50) {
      continue;
    }
    
    // Calculate approximate size in KB
    const sizeInKB = Math.round(styleContent.length / 1024);
    
    if (sizeInKB > (options.inlineStyleThreshold || 1)) {
      addIssue(
        issuesMap,
        documentPath,
        `Large inline style (${sizeInKB}KB) found. Consider moving to external file.`,
        'performance: inline code',
        distPath
      );
    }
  }
}

function checkViewportSettings(root, issuesMap, documentPath, distPath, options = {}) {
  // Check for viewport meta tag
  const viewportMeta = root.querySelector('meta[name="viewport"]');
  
  if (!viewportMeta) {
    addIssue(
      issuesMap,
      documentPath,
      'Missing viewport meta tag. Add <meta name="viewport" content="width=device-width, initial-scale=1">',
      'technical: mobile friendly',
      distPath
    );
    return;
  }
  
  // Check viewport content
  const content = viewportMeta.getAttribute('content') || '';
  
  if (!content.includes('width=device-width')) {
    addIssue(
      issuesMap,
      documentPath,
      'Viewport meta tag missing width=device-width',
      'technical: mobile friendly',
      distPath
    );
  }
  
  if (!content.includes('initial-scale=1')) {
    addIssue(
      issuesMap,
      documentPath,
      'Viewport meta tag missing initial-scale=1',
      'technical: mobile friendly',
      distPath
    );
  }
  
  // Check for user-scalable=no (bad for accessibility)
  if (content.includes('user-scalable=no') || content.includes('maximum-scale=1')) {
    addIssue(
      issuesMap,
      documentPath,
      'Viewport prevents zooming (user-scalable=no or maximum-scale=1), which harms accessibility',
      'technical: mobile friendly',
      distPath
    );
  }
}

async function checkResourceSizes(root, issuesMap, documentPath, distPath, options = {}) {
  // This is an advanced feature that would need to check actual file sizes
  // For now, we'll implement a basic version that checks local resources
  
  // Map document path to its directory to resolve relative URLs
  const docDir = path.dirname(documentPath);
  
  // Check image sizes
  const images = root.querySelectorAll('img[src]');
  for (const img of images) {
    const src = img.getAttribute('src') || '';
    
    // Skip external and data URLs
    if (src.startsWith('http') || src.startsWith('data:')) {
      continue;
    }
    
    // Resolve path relative to the document
    const imgPath = path.resolve(docDir, src.startsWith('/') ? path.join(distPath, src) : src);
    
    try {
      if (fs.existsSync(imgPath)) {
        const stats = fs.statSync(imgPath);
        const sizeInKB = Math.round(stats.size / 1024);
        
        if (sizeInKB > (options.imageSizeThreshold || IMAGE_SIZE_THRESHOLD)) {
          addIssue(
            issuesMap,
            documentPath,
            `Large image (${sizeInKB}KB): <img src="${src}">. Consider compression or next-gen formats.`,
            'performance: large resources',
            distPath
          );
        }
      }
    } catch (error) {
      // Skip file system errors
    }
  }
  
  // Similar checks could be implemented for CSS and JS files
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