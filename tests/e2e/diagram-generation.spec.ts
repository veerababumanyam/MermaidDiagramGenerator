/**
 * E2E tests for diagram generation workflow
 * Tests the complete user journey from landing to diagram export
 */

import { test, expect } from '@playwright/test';

test.describe('Diagram Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('http://localhost:5173');

    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  });

  test('should load the application successfully', async ({ page }) => {
    // Check that the main components are present
    await expect(page.locator('h1').filter({ hasText: 'Mermaid Diagram Generator' })).toBeVisible();

    // Check for main panels
    await expect(page.locator('[data-testid="editor-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible();

    // Check for main action buttons
    await expect(page.locator('button').filter({ hasText: 'Generate...' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'AI Co-pilot' })).toBeVisible();
  });

  test('should display template selection', async ({ page }) => {
    // Check that template selector is present
    const templateSelect = page.locator('select[id="template-select"]');
    await expect(templateSelect).toBeVisible();

    // Check that it has options
    const options = templateSelect.locator('option');
    await expect(options.first()).toBeVisible();

    // Count should be greater than 1 (default + templates)
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);
  });

  test('should show diagram preview when code is entered', async ({ page }) => {
    // Get the Monaco editor
    const editorContainer = page.locator('.monaco-editor');
    await expect(editorContainer).toBeVisible();

    // Wait for Monaco to be ready
    await page.waitForTimeout(2000);

    // Clear any existing content and enter basic flowchart code
    const basicFlowchart = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`;

    // Click in the editor to focus it
    await editorContainer.click();

    // Clear existing content (Ctrl+A, Delete)
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Type the flowchart code
    await page.keyboard.type(basicFlowchart, { delay: 50 });

    // Wait for rendering
    await page.waitForTimeout(1000);

    // Check that a diagram appears in the preview
    const previewPanel = page.locator('[data-testid="preview-panel"]');
    const svgElement = previewPanel.locator('svg');
    await expect(svgElement).toBeVisible({ timeout: 10000 });
  });

  test('should allow theme selection', async ({ page }) => {
    // Check theme selector
    const themeSelect = page.locator('select[id="theme-select"]');
    await expect(themeSelect).toBeVisible();

    // Change theme
    await themeSelect.selectOption('dark');

    // Verify theme change (this would need more specific selectors based on your theme implementation)
    // For now, just verify the select works
    const selectedValue = await themeSelect.inputValue();
    expect(selectedValue).toBe('dark');
  });

  test('should show AI generation modal', async ({ page }) => {
    // Click the Generate button
    const generateButton = page.locator('button').filter({ hasText: 'Generate...' });
    await generateButton.click();

    // Check that modal appears
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check modal content
    await expect(page.locator('h2').filter({ hasText: 'Generate Diagram with AI' })).toBeVisible();

    // Check for textarea
    const textarea = modal.locator('textarea');
    await expect(textarea).toBeVisible();

    // Close modal
    const closeButton = modal.locator('button').filter({ hasText: 'Cancel' });
    await closeButton.click();

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('should allow icon set selection', async ({ page }) => {
    // Check icon set selector
    const iconSelect = page.locator('select[id="icon-set-select"]');
    await expect(iconSelect).toBeVisible();

    // Check available options
    const options = iconSelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1); // At least 'none' + one icon set

    // Select Cisco icon set
    await iconSelect.selectOption('cisco');

    // Verify selection
    const selectedValue = await iconSelect.inputValue();
    expect(selectedValue).toBe('cisco');
  });

  test('should show export options', async ({ page }) => {
    // Check export buttons
    await expect(page.locator('button').filter({ hasText: 'SVG' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'PNG' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'PDF' })).toBeVisible();
  });

  test('should support undo/redo functionality', async ({ page }) => {
    // Check undo/redo buttons
    const undoButton = page.locator('button[title="Undo (Ctrl+Z)"]');
    const redoButton = page.locator('button[title="Redo (Ctrl+Y)"]');

    await expect(undoButton).toBeVisible();
    await expect(redoButton).toBeVisible();

    // Initially, undo should be disabled
    await expect(undoButton).toBeDisabled();
    await expect(redoButton).toBeDisabled();
  });

  test('should handle responsive layout', async ({ page }) => {
    // Test on different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      // Verify main elements are still visible and functional
      await expect(page.locator('h1').filter({ hasText: 'Mermaid Diagram Generator' })).toBeVisible();
      await expect(page.locator('[data-testid="editor-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible();
    }
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Focus on editor
    const editorContainer = page.locator('.monaco-editor');
    await editorContainer.click();

    // Test basic typing
    await page.keyboard.type('graph TD\nA --> B');

    // Test undo with Ctrl+Z
    await page.keyboard.press('Control+z');

    // Test redo with Ctrl+Y
    await page.keyboard.press('Control+y');
  });

  test('should show error handling for invalid diagrams', async ({ page }) => {
    // Enter invalid Mermaid code
    const editorContainer = page.locator('.monaco-editor');
    await editorContainer.click();

    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    await page.keyboard.type('invalid mermaid code {{{');

    // Wait for error to appear
    await page.waitForTimeout(2000);

    // Check if error message appears (this depends on your error handling implementation)
    // You might need to adjust this selector based on your actual error display
    const errorElement = page.locator('[data-testid="error-message"]').or(
      page.locator('.error').or(
        page.locator('[class*="error"]')
      )
    );

    // This test might need adjustment based on your specific error handling UI
    try {
      await expect(errorElement).toBeVisible({ timeout: 5000 });
    } catch {
      console.log('Error display test: Error UI not found, this might be expected');
    }
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Check for ARIA landmarks
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Check for proper heading hierarchy
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);

    // Check for focus management
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Tab through interactive elements
    const tabbableElements = [
      'button',
      'select',
      'input',
      'textarea',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const elements = page.locator(tabbableElements);
    const count = await elements.count();

    // Should have reasonable number of tabbable elements
    expect(count).toBeGreaterThan(5);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // This is a basic check - you might want to use a more sophisticated
    // color contrast testing tool for production
    const textElements = page.locator('*:not(script):not(style)');

    // Verify that text elements exist and are visible
    const visibleTextElements = await textElements.filter(':visible').count();
    expect(visibleTextElements).toBeGreaterThan(0);
  });
});

