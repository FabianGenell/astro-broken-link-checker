import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTests } from './setup.js';

describe('Site Report Tests', () => {
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

  it('should include a summary section', () => {
    const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
    expect(reportContent).toContain('# Site Report');
    expect(reportContent).toContain('## Summary');
    expect(reportContent).toMatch(/Broken Links: \d+/);
    expect(reportContent).toMatch(/SEO Issues: \d+/);
  });

  describe('Broken Links Section', () => {
    it('should detect broken links', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for broken links section
      expect(reportContent).toContain('## 🔗 Broken Links');
      
      // Check for specific broken links
      expect(reportContent).toContain('/non-existent-page');
      expect(reportContent).toContain('/another-missing-page');
      expect(reportContent).toContain('./relative-broken-link');
      expect(reportContent).toContain('../path/changing/relative-broken-link');
      expect(reportContent).toContain('/missing.jpg');
      
      // Check for "Found in" section
      expect(reportContent).toContain('Found in:');
    });
    
    it('should not report valid links as broken', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // These links should not be reported as broken
      const validLinksSubstrings = [
        '/about',
        '/redirected',
        '/exists.jpg'
      ];
      
      // For each valid link, ensure it doesn't appear in the Broken Links section
      for (const link of validLinksSubstrings) {
        // Get the Broken Links section
        const brokenLinksSection = reportContent.split('## 🔗 Broken Links')[1]?.split('##')[0] || '';
        expect(brokenLinksSection).not.toContain(`### ${link}`);
      }
    });
  });
  
  describe('SEO Issues Section', () => {
    it('should detect exposed emails', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for SEO issues section
      expect(reportContent).toContain('## 🔍 SEO Issues');
      
      // Check for privacy category
      expect(reportContent).toContain('### 🔒 Privacy: Exposed Email Addresses');
      
      // Check for specific issues
      expect(reportContent).toContain('Raw email exposed: test@example.com');
      expect(reportContent).toContain('Unobfuscated mailto link: exposed@example.com');
      
      // Check page is listed
      expect(reportContent).toContain('/emails');
    });
    
    it('should not report obfuscated or allowlisted emails', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // These shouldn't appear in the report
      expect(reportContent).not.toContain('test [at] example [dot] com');
      expect(reportContent).not.toContain('obfuscated@example.com');
      expect(reportContent).not.toContain('allowlisted@example.com');
    });
  });
});