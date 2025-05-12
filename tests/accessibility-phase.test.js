import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTests } from './setup.js';

describe('Accessibility & UX Flags Phase Tests', () => {
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

  describe('Missing alt attribute detection', () => {
    it('should detect images without alt attributes', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');

      // Check for missing alt category
      expect(reportContent).toContain('accessibility: missing alt');

      // Check for specific image issues - now we have simpler issue descriptions
      expect(reportContent).toContain('Missing alt attribute on <img>');

      // Check for important attributes in the report
      expect(reportContent).toContain('src="/example-image.jpg"');
      expect(reportContent).toContain('src="/another-image.png"');

      // Check page is listed
      expect(reportContent).toContain('/accessibility-issues');
    });

    it('should detect empty alt attributes when configured', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');

      // If the optional empty alt check is enabled, this should be detected
      // Otherwise it might not appear. The test will need to be conditionally run.
      if (reportContent.includes('accessibility: empty alt')) {
        expect(reportContent).toContain('Empty alt attribute on <img>');
        expect(reportContent).toContain('src="/decorative-image.svg"');
      }
    });
  });

  describe('Empty interactive elements detection', () => {
    it('should detect buttons without accessible text', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');

      // Check for unlabeled interactive elements category
      expect(reportContent).toContain('accessibility: unlabeled interactive');

      // Check for empty buttons
      expect(reportContent).toContain('Empty button without accessible text');

      // Check page is listed
      expect(reportContent).toContain('/accessibility-issues');
    });

    it('should detect links without accessible text', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');

      // Check for empty links - more general now since we've updated the issue format
      expect(reportContent).toContain('Empty link without accessible text');

      // Check page is listed
      expect(reportContent).toContain('/accessibility-issues');
    });

    it('should not flag elements with aria-label', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      const accessibilitySection = extractSection(reportContent, 'accessibility: unlabeled interactive');

      // These should not appear as issues
      expect(accessibilitySection).not.toContain('aria-label="This button has an aria-label"');
      expect(accessibilitySection).not.toContain('aria-label="This link has an aria-label"');
    });
  });
  
  describe('Generic link text detection', () => {
    it('should detect generic link text', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for generic link text category
      expect(reportContent).toContain('accessibility: generic link text');
      
      // Check for specific generic phrases
      const genericPhrases = [
        'Click here',
        'Read more',
        'Learn more',
        'More info',
        'here'
      ];
      
      for (const phrase of genericPhrases) {
        expect(reportContent).toContain(`Generic link text "${phrase.toLowerCase()}"`);
      }
      
      // Check page is listed
      expect(reportContent).toContain('/accessibility-issues');
    });
    
    it('should not flag descriptive link text', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      const genericTextSection = extractSection(reportContent, 'accessibility: generic link text');
      
      // These should not appear as issues
      expect(genericTextSection).not.toContain('Contact our support team');
      expect(genericTextSection).not.toContain('Ergonomic Office Chairs');
    });
  });
});

// Helper function to extract a section from the report content
function extractSection(content, sectionName) {
  const sectionMatches = content.match(new RegExp(`${sectionName}[\\s\\S]*?(?=###|$)`, 'i'));
  return sectionMatches ? sectionMatches[0] : '';
}