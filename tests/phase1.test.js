import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTests } from './setup.js';

describe('Phase 1: Foundation + Privacy Tests', () => {
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

  it('should detect exposed emails', () => {
    const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
    
    // Privacy section should exist
    expect(reportContent).toContain('Privacy: Exposed Email Addresses');
    
    // Raw email detection
    expect(reportContent).toContain('Raw email exposed: test@example.com');
    
    // Mailto link detection
    expect(reportContent).toContain('Unobfuscated mailto link: exposed@example.com');
    
    // Email page should be listed
    expect(reportContent).toContain('/emails');
  });

  it('should not report obfuscated or allowlisted emails', () => {
    const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
    
    // Get the privacy section
    const privacySection = extractSectionContent(reportContent, 'Privacy: Exposed Email Addresses');
    
    // Should not contain the obfuscated email
    expect(privacySection).not.toContain('test [at] example [dot] com');
    
    // Should not flag the mailto link with non-email text
    expect(privacySection).not.toContain('obfuscated@example.com');
    
    // Should not contain allowlisted emails
    expect(privacySection).not.toContain('allowlisted@example.com');
  });
});

// Helper function to extract a section from the report
function extractSectionContent(content, sectionName) {
  const sectionMatches = content.match(new RegExp(`### [^#]*${sectionName}[\\s\\S]*?(?=###|$)`, 'i'));
  return sectionMatches ? sectionMatches[0] : '';
}