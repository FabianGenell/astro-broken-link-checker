import { execa } from 'execa';
import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const testProjectDir = path.join(__dirname);

describe('Phase 1: Foundation + Privacy Tests', () => {
  let buildResult;
  const seoReportPath = path.join(testProjectDir, 'seo-report.log');

  beforeAll(async () => {
    // Ensure the integration is built
    await execa('npm', ['run', 'build'], { cwd: path.join(__dirname, '..') });

    // Install dependencies for the test project
    await execa('npm', ['install'], { cwd: testProjectDir });

    // Run the build process of the test project
    buildResult = await execa('npm', ['run', 'build'], { cwd: testProjectDir });

    // Display the build result
    console.log(buildResult.stdout);
  }, 60000); // Increase timeout if necessary

  afterAll(() => {
    // Clean up
    if (fs.existsSync(seoReportPath)) {
      fs.unlinkSync(seoReportPath);
    }
  });

  it('should generate a seo-report.log file', () => {
    expect(fs.existsSync(seoReportPath)).toBe(true);
  });

  it('should detect exposed emails', () => {
    const logContent = fs.readFileSync(seoReportPath, 'utf-8');
    
    // Basic structure checks
    expect(logContent).toContain('# SEO Report');
    expect(logContent).toContain('## privacy: exposed email');
    
    // Raw email detection
    expect(logContent).toContain('Raw email exposed: test@example.com');
    
    // Mailto link detection
    expect(logContent).toContain('Unobfuscated mailto link: exposed@example.com');
    
    // Expect the email page to be listed
    expect(logContent).toContain('/emails');
  });

  it('should not report obfuscated or allowlisted emails', () => {
    const logContent = fs.readFileSync(seoReportPath, 'utf-8');
    
    // Should not contain the obfuscated email
    expect(logContent).not.toContain('test [at] example [dot] com');
    
    // Should not flag the mailto link with non-email text
    expect(logContent).not.toContain('obfuscated@example.com');
    
    // Should not contain allowlisted emails
    expect(logContent).not.toContain('allowlisted@example.com');
  });
});