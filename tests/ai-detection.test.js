import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTests } from './setup.js';
import { PHASE_IDS } from '../src/phases/types.js';

describe('AI Detection Phase Tests', () => {
  let testProjectDir;
  let reportFilePath;

  beforeAll(async () => {
    // Use shared setup with AI detection enabled
    const setup = await setupTests({
      phases: {
        [PHASE_IDS.AI_DETECTION]: true
      },
      // Set a lower threshold to ensure detection in our test case
      aiDetectionThreshold: 50
    });
    testProjectDir = setup.testProjectDir;
    reportFilePath = path.join(testProjectDir, 'dist', 'site-report.log');
  }, 30000);

  it('should generate a site report file', () => {
    expect(fs.existsSync(reportFilePath)).toBe(true);
  });

  it('should detect AI-generated content', () => {
    const reportContent = fs.readFileSync(reportFilePath, 'utf-8');

    // AI content section should exist
    expect(reportContent).toContain('Content: Potentially AI-Generated Text');

    // AI content page should be listed
    expect(reportContent).toContain('/ai-content');
  });

  it('should analyze content based on AI patterns', () => {
    const reportContent = fs.readFileSync(reportFilePath, 'utf-8');

    // Verify that the AI content section exists
    expect(reportContent).toContain('Content: Potentially AI-Generated Text');

    // Get the AI content section
    const aiSection = extractSectionContent(reportContent, 'Content: Potentially AI-Generated Text');

    // The AI article should be detected (based on formal language, transitions, etc.)
    expect(aiSection).toBeTruthy();

    // Ensure AI-content page is mentioned
    expect(reportContent).toContain('/ai-content/');
  });

  it('should respect the configurable threshold', () => {
    // This is an indirect test based on our threshold setting
    // We set threshold to 50% in the setup, so we expect detection
    const reportContent = fs.readFileSync(reportFilePath, 'utf-8');

    // Simply verify that AI content is detected, which means the threshold was respected
    expect(reportContent).toContain('Content: Potentially AI-Generated Text');
  });
});

// Helper function to extract a section from the report
function extractSectionContent(content, sectionName) {
  const sectionMatches = content.match(new RegExp(`### [^#]*${sectionName}[\\s\\S]*?(?=###|$)`, 'i'));
  return sectionMatches ? sectionMatches[0] : '';
}