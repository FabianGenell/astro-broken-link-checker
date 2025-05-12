import { execa } from 'execa';
import fs from 'fs';
import path from 'path';

const testProjectDir = path.join(__dirname);

/**
 * Shared test setup to avoid duplicate builds
 */
export async function setupTests() {
  // Return if we've already built in this test run
  if (global.__TEST_SETUP_COMPLETE__) {
    return { testProjectDir };
  }

  try {
    // Ensure the integration is built
    await execa('npm', ['run', 'build'], { cwd: path.join(__dirname, '..') });

    // Install dependencies for the test project (only if needed)
    if (!fs.existsSync(path.join(testProjectDir, 'node_modules'))) {
      await execa('npm', ['install'], { cwd: testProjectDir });
    }

    // Clean output directory
    const outputDir = path.join(testProjectDir, 'dist');
    if (fs.existsSync(outputDir)) {
      // Recursively delete contents but keep the directory
      const files = fs.readdirSync(outputDir);
      for (const file of files) {
        const filePath = path.join(outputDir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    } else {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Run the build process of the test project with special options
    const buildResult = await execa('npm', ['run', 'build'], { 
      cwd: testProjectDir,
      env: {
        ...process.env,
        // Disable watch mode completely
        ASTRO_DISABLE_WATCH_MODE: 'true',
        // Disable watching for file changes
        WATCH: 'false',
        // Skip waiting for file changes
        NO_WATCH: 'true'
      }
    });
    
    // Mark setup as complete
    global.__TEST_SETUP_COMPLETE__ = true;
    
    return { 
      testProjectDir,
      buildResult 
    };
  } catch (error) {
    console.error('Error during test setup:', error);
    throw error;
  }
}