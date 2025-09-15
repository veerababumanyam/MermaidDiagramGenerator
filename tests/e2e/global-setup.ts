/**
 * Global setup for E2E tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set up any global test data or configuration
  console.log('🔧 Setting up E2E test environment...');

  // You can set up test data, create test users, etc. here
  // For example, you might want to:
  // - Set up test API keys
  // - Configure test environment variables
  // - Initialize test databases
  // - Set up test users/accounts

  console.log('✅ E2E test environment setup complete');
}

export default globalSetup;

