import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTests } from './setup.js';

describe('Astro Broken Links Checker Integration', () => {
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
    
    // Check that documents are listed
    expect(reportContent).toContain('Found in:');
  });

  it('should not report valid links as broken', () => {
    const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
    
    // Get the broken links section
    const brokenLinksSection = reportContent.split('## 🔗 Broken Links')[1]?.split('##')[0] || '';
    
    // These links should not be reported as broken
    expect(brokenLinksSection).not.toContain('### /about');
    expect(brokenLinksSection).not.toContain('### /');
    expect(brokenLinksSection).not.toContain('### /redirected');
    expect(brokenLinksSection).not.toContain('### /exists.jpg');
  });
});