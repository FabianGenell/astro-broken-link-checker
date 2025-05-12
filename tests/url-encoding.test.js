/**
 * Test case for URL encoding handling
 * 
 * This test ensures that the link checker correctly handles URLs with spaces
 * and special characters, including those that are URL-encoded.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { checkFoundationPhase } from '../src/phases/foundation-phase.js';
import fs from 'fs';
import path from 'path';
import { CATEGORIES } from '../src/phases/types.js';

// Mocks
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// Test directory setup
const testDir = path.join(process.cwd(), 'tests', 'tmp');
const testFilesDir = path.join(testDir, 'files');
const testDistDir = path.join(testDir, 'dist');

// Create test directories
beforeAll(() => {
  // Create the test directories
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  if (!fs.existsSync(testFilesDir)) {
    fs.mkdirSync(testFilesDir, { recursive: true });
  }
  if (!fs.existsSync(testDistDir)) {
    fs.mkdirSync(testDistDir, { recursive: true });
  }
  
  // Create files with spaces in their names
  fs.writeFileSync(path.join(testDistDir, 'file with spaces.html'), '<html><body>Test</body></html>');
  fs.writeFileSync(path.join(testDistDir, 'special%20chars.html'), '<html><body>Test</body></html>');
  
  // Create a file in a directory with spaces
  const dirWithSpaces = path.join(testDistDir, 'dir with spaces');
  if (!fs.existsSync(dirWithSpaces)) {
    fs.mkdirSync(dirWithSpaces, { recursive: true });
  }
  fs.writeFileSync(path.join(dirWithSpaces, 'index.html'), '<html><body>Test</body></html>');
});

// Clean up test directories
afterAll(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

describe('URL encoding tests', () => {
  it('should handle links with spaces correctly', async () => {
    // Create a test HTML file with links containing spaces
    const htmlContent = `
      <html>
        <body>
          <a href="/file with spaces.html">File with spaces</a>
          <a href="/dir with spaces/">Directory with spaces</a>
          <img src="/file with spaces.html" alt="Image" />
        </body>
      </html>
    `;
    
    const brokenLinksMap = new Map();
    const checkedLinks = new Map();
    const issuesMap = new Map();
    
    await checkFoundationPhase(
      htmlContent,
      issuesMap,
      '/',
      path.join(testDistDir, 'test.html'),
      testDistDir,
      {
        brokenLinksMap,
        checkedLinks,
        logger: mockLogger
      }
    );
    
    // Expect no broken links because files with spaces exist
    expect(brokenLinksMap.size).toBe(0);
  });
  
  it('should handle URL-encoded links correctly', async () => {
    // Create a test HTML file with URL-encoded links
    const htmlContent = `
      <html>
        <body>
          <a href="/file%20with%20spaces.html">File with spaces (encoded)</a>
          <a href="/dir%20with%20spaces/">Directory with spaces (encoded)</a>
          <a href="/special%20chars.html">Special characters</a>
        </body>
      </html>
    `;
    
    const brokenLinksMap = new Map();
    const checkedLinks = new Map();
    const issuesMap = new Map();
    
    await checkFoundationPhase(
      htmlContent,
      issuesMap,
      '/',
      path.join(testDistDir, 'test.html'),
      testDistDir,
      {
        brokenLinksMap,
        checkedLinks,
        logger: mockLogger
      }
    );
    
    // Expect no broken links because encoded URLs should be properly handled
    expect(brokenLinksMap.size).toBe(0);
  });
  
  it('should correctly identify broken links regardless of encoding', async () => {
    // Create a test HTML file with non-existent links in both formats
    const htmlContent = `
      <html>
        <body>
          <a href="/non existent file.html">Non-existent file with spaces</a>
          <a href="/non%20existent%20file.html">Non-existent file (encoded)</a>
        </body>
      </html>
    `;
    
    const brokenLinksMap = new Map();
    const checkedLinks = new Map();
    const issuesMap = new Map();
    
    await checkFoundationPhase(
      htmlContent,
      issuesMap,
      '/',
      path.join(testDistDir, 'test.html'),
      testDistDir,
      {
        brokenLinksMap,
        checkedLinks,
        logger: mockLogger
      }
    );
    
    // Expect broken links to be detected
    expect(brokenLinksMap.size).toBe(2);
  });
});