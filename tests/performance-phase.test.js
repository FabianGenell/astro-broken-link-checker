import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTests } from './setup.js';

describe('Performance & Technical SEO Phase Tests', () => {
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

  describe('Image dimension checks', () => {
    it('should detect images without width/height attributes', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for performance: layout shift category
      expect(reportContent).toContain('performance: layout shift');
      
      // Check for specific image issues
      expect(reportContent).toContain('missing width and height attributes');
      
      // Check page is listed
      expect(reportContent).toContain('/performance-issues');
    });
  });
  
  describe('Render-blocking resource detection', () => {
    it('should detect render-blocking scripts', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for render blocking category
      expect(reportContent).toContain('performance: render blocking');
      
      // Check for script without async/defer
      expect(reportContent).toContain('Render-blocking script');
      expect(reportContent).toContain('without async or defer');
      
      // Check page is listed
      expect(reportContent).toContain('/performance-issues');
    });
    
    it('should detect render-blocking stylesheets', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for render blocking category
      expect(reportContent).toContain('performance: render blocking');
      
      // Check for render-blocking stylesheet
      expect(reportContent).toContain('Render-blocking stylesheet');
      
      // Check page is listed
      expect(reportContent).toContain('/performance-issues');
    });
  });
  
  // Skip inline code tests since Astro handles inline scripts and styles differently in the build
  describe.skip('Inline code detection', () => {
    it('should detect large inline scripts and styles', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');

      // Check for inline code category
      expect(reportContent).toContain('performance: inline code');

      // Check for inline script warning
      expect(reportContent).toContain('Large inline script');

      // Check for inline style warning
      expect(reportContent).toContain('Large inline style');

      // Check page is listed
      expect(reportContent).toContain('/performance-issues');
    });
  });
  
  describe('Viewport settings', () => {
    it('should detect missing viewport meta tag', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for mobile friendly category
      expect(reportContent).toContain('technical: mobile friendly');
      
      // Check for missing viewport
      expect(reportContent).toContain('Missing viewport meta tag');
      
      // Check page is listed
      expect(reportContent).toContain('/viewport-issues');
    });
    
    it('should detect improper viewport settings', () => {
      const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
      
      // Check for issues with viewport settings
      expect(reportContent).toContain('Viewport prevents zooming');
      
      // Check page is listed
      expect(reportContent).toContain('/viewport-issues');
    });
  });
});