import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTests } from './setup.js';

describe('Phase 2: Metadata & Semantic Structure Tests', () => {
  let testProjectDir;
  let reportFilePath;

  beforeAll(async () => {
    // Use shared setup
    const setup = await setupTests();
    testProjectDir = setup.testProjectDir;
    reportFilePath = path.join(testProjectDir, 'dist', 'site-report.log');
  }, 30000);

  it('should generate a site report file', () => {
    expect(fs.existsSync(reportFilePath)).toBe(true);
  });

  describe('Missing metadata detection', () => {
    it('should detect missing title and meta description', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for metadata: missing elements category
      expect(reportContent).toContain('metadata: missing elements');
      
      // Check for specific issues
      expect(reportContent).toContain('Missing <title> tag');
      expect(reportContent).toContain('Missing <meta name="description"> tag');
      
      // Check page is listed
      expect(reportContent).toContain('/metadata-missing');
    });
    
    it('should detect empty metadata elements', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for empty elements category
      expect(reportContent).toContain('metadata: empty elements');
      
      // Check for specific issues
      expect(reportContent).toContain('Empty <title> tag');
      expect(reportContent).toContain('Empty meta description');
      
      // Check page is listed
      expect(reportContent).toContain('/metadata-empty');
    });
  });
  
  describe('Duplicate metadata detection', () => {
    it('should detect duplicate titles and descriptions', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for duplicates category
      expect(reportContent).toContain('metadata: duplicates');
      
      // Check for duplicate title and description
      expect(reportContent).toContain('Duplicate title "Duplicate Title"');
      expect(reportContent).toContain('Duplicate meta description');
      
      // Check that both pages are mentioned
      expect(reportContent).toContain('/metadata-duplicate-1');
      expect(reportContent).toContain('/metadata-duplicate-2');
    });
  });
  
  describe('Heading structure validation', () => {
    it('should detect missing h1 tags', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for semantic: heading structure category
      expect(reportContent).toContain('semantic: heading structure');
      
      // Check for missing h1
      expect(reportContent).toContain('Missing <h1> tag');
      
      // Check page is listed
      expect(reportContent).toContain('/metadata-missing');
    });
    
    it('should detect multiple h1 tags', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for multiple h1 tags
      expect(reportContent).toContain('Multiple <h1> tags');
      
      // Check page is listed
      expect(reportContent).toContain('/heading-issues');
    });
    
    it('should detect empty h1 tags', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for empty h1 tags
      expect(reportContent).toContain('Empty <h1> tag');
      
      // Check page is listed
      expect(reportContent).toContain('/metadata-empty');
    });
  });
  
  describe('Language attribute validation', () => {
    it('should detect missing and empty lang attributes', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');

      // Check for the semantic language category
      expect(reportContent).toContain('🌐 Semantic: Language Attribute Issues');

      // Check for missing and empty lang attributes directly in the report
      expect(reportContent).toContain('Missing lang attribute on <html> tag');
      expect(reportContent).toContain('Empty lang attribute on <html> tag');

      // Check that the right pages are listed
      const missingSection = reportContent.match(/Missing lang attribute[\s\S]*?Found in:[\s\S]*?metadata-missing/);
      const emptySection = reportContent.match(/Empty lang attribute[\s\S]*?Found in:[\s\S]*?metadata-empty/);

      expect(missingSection).not.toBeNull();
      expect(emptySection).not.toBeNull();
    });
  });
  
  describe('Canonical link validation', () => {
    it('should detect canonical links pointing to different pages', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for metadata: canonical category
      expect(reportContent).toContain('metadata: canonical');
      
      // Check for canonical link not pointing to current page
      expect(reportContent).toContain('Canonical link');
      expect(reportContent).toContain(`doesn't point to current page`);
      
      // Check page is listed
      expect(reportContent).toContain('/canonical-issue');
    });
    
    it('should detect empty canonical links', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for empty canonical href
      expect(reportContent).toContain('Empty href in canonical link');
      
      // Check page is listed
      expect(reportContent).toContain('/metadata-empty');
    });
  });
  
  describe('Good metadata validation', () => {
    it('should not report well-formed pages', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // This page should not appear in issues
      const goodPagePath = '/good-metadata';
      
      // For categories we're testing
      const categories = [
        'metadata: missing elements',
        'metadata: empty elements',
        'metadata: duplicates',
        'semantic: heading structure',
        'semantic: language',
        'metadata: canonical'
      ];
      
      // Extract the issues sections for each category
      for (const category of categories) {
        const categorySection = getCategorySection(reportContent, category);
        if (categorySection) {
          expect(categorySection).not.toContain(goodPagePath);
        }
      }
    });
  });
});

// Helper function to extract a category section from the report
function getCategorySection(report, category) {
  const sections = report.split(/^### /m);
  for (const section of sections) {
    if (section.startsWith(category) || section.includes(category)) {
      return section;
    }
  }
  return null;
}

// Helper function to extract a category section with emoji prefix
function extractCategorySection(content, categoryName) {
  const sectionMatches = content.match(new RegExp(`### [^#]*${categoryName}[\\s\\S]*?(?=###|$)`, 'i'));
  return sectionMatches ? sectionMatches[0] : '';
}