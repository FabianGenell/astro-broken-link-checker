import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTests } from './setup.js';

describe('Crawlability & Linking Phase Tests', () => {
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

  describe('Robots meta tag detection', () => {
    it('should detect noindex meta tags', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for noindex category
      expect(reportContent).toContain('crawlability: noindex');
      
      // Check for specific issue
      expect(reportContent).toContain('prevents indexing');
      
      // Check page is listed
      expect(reportContent).toContain('/robots-issues');
    });
    
    it('should detect nofollow meta tags', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for nofollow meta category
      expect(reportContent).toContain('crawlability: nofollow');
      
      // Check for specific issue
      expect(reportContent).toContain('prevents following links');
      
      // Check page is listed
      expect(reportContent).toContain('/robots-issues');
    });
  });
  
  describe('Link rel attribute detection', () => {
    it('should detect internal links with nofollow', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for nofollow internal links category
      expect(reportContent).toContain('linking: nofollow internal');
      
      // Check for specific issue
      expect(reportContent).toContain('has rel="nofollow"');
      
      // Check page is listed
      expect(reportContent).toContain('/robots-issues');
    });
  });
  
  describe('Internal linking structure', () => {
    it('should detect pages with too few internal links', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for too few links category
      expect(reportContent).toContain('linking: too few links');
      
      // Check for specific issue
      expect(reportContent).toContain('recommend at least');
      
      // Check page is listed
      expect(reportContent).toContain('/robots-issues');
    });
  });
  
  describe('Robots.txt and sitemap detection', () => {
    it('should detect missing robots.txt and sitemap.xml', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for missing robots.txt
      expect(reportContent).toContain('crawlability: missing robots.txt');
      
      // Check for missing sitemap
      expect(reportContent).toContain('crawlability: missing sitemap');
      
      // Check issue is associated with the homepage
      expect(reportContent).toContain('/index');
    });
  });
});