// Phase 1: Foundation + Privacy
// - Detect all <a href> and <img src> like today
// - Add detection for mailto: and raw emails
// - Obfuscation check: warn if no protection
// - Add email allowlist

import { parse } from 'node-html-parser';
import path from 'path';
import { normalizeHtmlFilePath } from './utils.js';

const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const GENERIC_OBFUSCATION_PATTERNS = ['[at]', '[dot]', ' at ', ' dot '];

export async function checkPhase1(
  htmlContent,
  issuesMap,
  baseUrl,
  documentPath,
  distPath,
  options = {}
) {
  const allowlist = options.emailAllowlist || [];
  const root = parse(htmlContent);
  
  // 1. Check for raw emails in text content
  const textContent = extractTextContent(root);
  const rawEmails = findRawEmails(textContent, allowlist);
  
  // Add any found raw emails to the issues map
  for (const email of rawEmails) {
    addIssue(
      issuesMap, 
      documentPath, 
      `Raw email exposed: ${email}`, 
      'privacy: exposed email', 
      distPath
    );
  }
  
  // 2. Check for mailto: links without obfuscation
  const mailtoLinks = root.querySelectorAll('a[href^="mailto:"]');
  
  for (const link of mailtoLinks) {
    const href = link.getAttribute('href');
    const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
    
    // Skip if in allowlist
    if (allowlist.includes(email)) {
      continue;
    }
    
    const linkText = link.textContent.trim();
    
    // Consider a mailto link unobfuscated if the link text IS the email address
    if (linkText === email || linkText.includes(email)) {
      addIssue(
        issuesMap,
        documentPath,
        `Unobfuscated mailto link: ${email}`,
        'privacy: exposed email',
        distPath
      );
    }
  }
}

function extractTextContent(root) {
  // Extract only visible text content
  // First remove script and style tags
  const scripts = root.querySelectorAll('script');
  for (const script of scripts) {
    script.remove();
  }
  
  const styles = root.querySelectorAll('style');
  for (const style of styles) {
    style.remove();
  }
  
  // Get text content
  let content = root.textContent;
  
  // Decode HTML entities
  return decodeHtmlEntities(content);
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function findRawEmails(text, allowlist = []) {
  const emails = [];
  const regex = new RegExp(EMAIL_REGEX, 'g');
  let match;
  
  // Find all emails using regex
  while ((match = regex.exec(text)) !== null) {
    const email = match[0];
    
    // Skip if in allowlist
    if (allowlist.includes(email)) {
      continue;
    }
    
    // Skip if obfuscated
    const surroundingText = getSurroundingText(text, match.index, email.length);
    if (isObfuscated(surroundingText)) {
      continue;
    }
    
    emails.push(email);
  }
  
  return emails;
}

function getSurroundingText(text, index, length, contextSize = 30) {
  const start = Math.max(0, index - contextSize);
  const end = Math.min(text.length, index + length + contextSize);
  return text.substring(start, end);
}

function isObfuscated(text) {
  // Check for common obfuscation patterns
  return GENERIC_OBFUSCATION_PATTERNS.some(pattern => 
    text.toLowerCase().includes(pattern.toLowerCase())
  );
}

function addIssue(issuesMap, documentPath, issue, category, distPath) {
  // Normalize document path
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