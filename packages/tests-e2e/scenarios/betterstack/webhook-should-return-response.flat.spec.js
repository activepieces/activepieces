const { test, expect } = require('@playwright/test');

const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const baseUrl = process.env.BASEURL;

test('should handle webhook with return response', async ({ page }) => {
  test.setTimeout(120000);

  // Sign in
  await page.goto(`${baseUrl}/sign-in`);
  await page.getByTestId('sign-in-email').fill(email);
  await page.getByTestId('sign-in-password').fill(password);
  await page.getByTestId('sign-in-button').click();

  // Wait for sign-in to complete (navigate away from sign-in page)
  await page.waitForURL(url => !url.href.includes('sign-in'), { timeout: 30000 });

  // Navigate directly to automations
  await page.goto(`${baseUrl}/automations`);
  await page.waitForLoadState('networkidle');

  // Create new flow
  const createNewButton = page.getByRole('button', { name: 'Create New' });
  if (await createNewButton.isVisible()) {
    await createNewButton.click();
    await page.getByRole('menuitem', { name: 'New Flow' }).click();
  } else {
    await page.getByRole('button', { name: 'Start from scratch' }).first().click();
  }

  // Select webhook trigger
  await page.getByTestId('rf__node-trigger').filter({ hasText: 'Select Trigger' }).click();
  await page.getByTestId('pieces-search-input').fill('Catch Webhook');
  await page.getByText('Catch Webhook').click();

  // Grab webhook URL and build test URL
  const webhookUrl = await page.locator('input.grow.bg-background').inputValue();
  const runVersion = Math.floor(Math.random() * 100000);
  const urlWithParams = `${webhookUrl}/sync?targetRunVersion=${runVersion}`;

  // Test trigger
  await page.getByTestId('test-trigger-button').click();
  await page.waitForTimeout(5000);

  // Hit the webhook URL
  await page.context().request.get(urlWithParams);
  await page.waitForTimeout(5000);

  // Add return response action
  await page.getByTestId('add-action-button').click();
  await page.getByTestId('pieces-search-input').fill('Webhook');
  await page.getByTestId('Webhook').click();
  await page.getByText('Return Response').nth(1).click();
  await page.waitForTimeout(5000);
  
  // Fill response body
  await page.locator('div.cm-activeLine.cm-line').fill('');
  await page.locator('div.cm-activeLine.cm-line').fill(
    '{"targetRunVersion": "{{trigger[\'queryParams\'][\'targetRunVersion\']}}"}'
  );
  await page.waitForTimeout(1000);

  // Publish
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForTimeout(15000);

  // Hit webhook and assert response
  const response = await page.context().request.get(urlWithParams);
  const body = await response.json();
  expect(body.targetRunVersion).toBe(runVersion.toString());

  // Go back to automations and bulk delete all flows
  await page.goto(`${baseUrl}/automations`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('checkbox').first().click();
  await page.locator('button:has(svg.lucide-trash-2)').click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
});
