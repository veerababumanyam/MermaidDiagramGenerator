/**
 * Global teardown for E2E tests
 * Runs once after all tests
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');

  // Clean up any global test data or resources
  // For example, you might want to:
  // - Clean up test data
  // - Remove test users
  // - Reset test environment state
  // - Generate test reports

  console.log('✅ E2E test environment cleanup complete');
}

export default globalTeardown;

