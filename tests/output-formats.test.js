import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTests } from './setup.js';
import { formatReport, OUTPUT_FORMATS } from '../src/formatters/index.js';
import { formatMarkdown } from '../src/formatters/markdown-formatter.js';
import { formatJSON } from '../src/formatters/json-formatter.js';
import { formatCSV } from '../src/formatters/csv-formatter.js';

describe('Output Format Tests', () => {
  const testDir = path.join(__dirname, 'output-test');
  
  // Create test data
  const brokenLinksMap = new Map();
  brokenLinksMap.set('/broken-page', new Set(['/page1', '/page2']));
  brokenLinksMap.set('/another-broken', new Set(['/page3']));
  
  const seoIssuesMap = new Map();
  const categoryMap = new Map();
  categoryMap.set('Missing meta description', new Set(['/page1']));
  categoryMap.set('Empty title tag', new Set(['/page2', '/page3']));
  seoIssuesMap.set('metadata: missing elements', categoryMap);
  
  // Add a different category
  const privacyMap = new Map();
  privacyMap.set('Raw email exposed: test@example.com', new Set(['/page1']));
  seoIssuesMap.set('privacy: exposed email', privacyMap);
  
  // Options for formatters
  const options = {
    startTime: Date.now() - 1000, // Simulate a 1 second scan
    filePath: 'test-report' // Will be modified per test
  };
  
  // Setup and cleanup
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testDir, file));
      });
      fs.rmdirSync(testDir);
    }
  });
  
  it('should generate markdown report', () => {
    const markdownPath = path.join(testDir, 'report.md');
    const markdownOptions = { ...options, filePath: markdownPath };
    
    const content = formatMarkdown(brokenLinksMap, seoIssuesMap, markdownOptions);
    
    // Write content for inspection
    fs.writeFileSync(markdownPath, content);
    
    // Verify content
    expect(content).toContain('# Site Report');
    expect(content).toContain('## Summary');
    expect(content).toContain('## 🔗 Broken Links');
    expect(content).toContain('## 🔍 SEO Issues');
    expect(content).toContain('/broken-page');
    expect(content).toContain('Missing meta description');
  });
  
  it('should generate JSON report', () => {
    const jsonPath = path.join(testDir, 'report.json');
    const jsonOptions = { ...options, filePath: jsonPath };
    
    const content = formatJSON(brokenLinksMap, seoIssuesMap, jsonOptions);
    
    // Write content for inspection
    fs.writeFileSync(jsonPath, content);
    
    // Parse the JSON and validate its structure
    const report = JSON.parse(content);
    
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('scanDuration');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('brokenLinks');
    expect(report).toHaveProperty('seoIssues');
    
    // Verify counts
    expect(report.summary.brokenLinkCount).toBe(2);
    expect(report.summary.seoIssueCount).toBe(3);
    
    // Verify issues
    expect(report.seoIssues['metadata: missing elements']).toHaveLength(2);
    expect(report.seoIssues['privacy: exposed email']).toHaveLength(1);
    
    // Verify broken links
    expect(report.brokenLinks).toHaveLength(2);
    expect(report.brokenLinks[0].pages).toContain('/page1');
  });
  
  it('should generate CSV report', () => {
    const csvPath = path.join(testDir, 'report.csv');
    const csvOptions = { ...options, filePath: csvPath };
    
    const content = formatCSV(brokenLinksMap, seoIssuesMap, csvOptions);
    
    // Write content for inspection
    fs.writeFileSync(csvPath, content);
    
    // Verify CSV format
    expect(content).toContain('issue_type,category,issue,page,timestamp');
    expect(content).toContain('"broken_link","broken_link","/broken-page","/page1",');
    expect(content).toContain('"broken_link","broken_link","/broken-page","/page2",');
    expect(content).toContain('"seo_issue","metadata: missing elements","Missing meta description","/page1",');
  });
  
  it('should select the correct formatter based on file extension', () => {
    // Test markdown formatter selection
    let report = formatReport(brokenLinksMap, seoIssuesMap, { 
      ...options, 
      filePath: 'report.md' 
    });
    expect(report).toContain('# Site Report');
    
    // Test JSON formatter selection
    report = formatReport(brokenLinksMap, seoIssuesMap, { 
      ...options, 
      filePath: 'report.json' 
    });
    expect(report).toContain('"timestamp":');
    
    // Test CSV formatter selection
    report = formatReport(brokenLinksMap, seoIssuesMap, { 
      ...options, 
      filePath: 'report.csv' 
    });
    expect(report).toContain('issue_type,category,issue,page,timestamp');
    
    // Test explicit format override
    report = formatReport(brokenLinksMap, seoIssuesMap, { 
      ...options, 
      filePath: 'report.txt',
      format: OUTPUT_FORMATS.JSON
    });
    expect(report).toContain('"timestamp":');
  });
});