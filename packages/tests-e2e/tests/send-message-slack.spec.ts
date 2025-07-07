import { expect, test } from '@playwright/test';

// The account must be empty, and no flows should be present otherwise the test will fail and has a slack connection
const config = {
  email: process.env.E2E_EMAIL,
  password: process.env.E2E_PASSWORD,
  channel: 'spam',
  url: 'https://cloud.activepieces.com/'
};

test('Test Send Slack message', async ({ page }) => {

  test.setTimeout(120000);

  await page.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache' });
  await page.setExtraHTTPHeaders({ 'ngrok-skip-browser-warning': 'true' })

  await testSignIn(page, config);
  // Use first() to handle multiple elements with similar names
  await page.getByRole('button', { name: 'Slack E2E' }).first().click();


  const newFlowButton = await page.getByRole('button', { name: 'Create Flow' })

  await page.waitForSelector('button:has-text("Create Flow")');

  while ((await page.locator('span.text-muted-foreground').count()) > 1) {
    if (!await page.locator('td:nth-child(7)').first().count()) break;
    await page.locator('td:nth-child(7)').first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const confirmButton = await page.getByRole('button', { name: 'Remove' });
    await confirmButton.click();
    // Use waitFor to wait for the button to disappear
    await page.waitForSelector('button:has-text("Remove")', { state: 'hidden' });
    await page.reload()
  }
  await newFlowButton.click()
  await page.getByText('From scratch').click();

  await page.locator('div[data-testid="rf__node-trigger"]').filter({ hasText: 'Select Trigger' }).click();
  await page.getByRole('textbox', { name: 'Search' }).fill('Every Hour');
  await page.getByText('Every Hour').click()
  await page.waitForTimeout(2000);

  // 🔽 Try clicking "Dismiss" if it's visible
  const dismissButton = page.getByRole('button', { name: 'Dismiss' })
  if (await dismissButton.isVisible()) {
    await dismissButton.click();
  }

  await page.getByText('Load Sample data').click();
  await page.waitForTimeout(8000);

  await page.locator('div.bg-light-blue').click();
  await page.getByRole('textbox', { name: 'Search' }).fill('Slack');
  await page.getByText('Slack', { exact: true }).click();
  await page.getByText('Send Message To A Channel').click();

  await page.locator('button').filter({ hasText: 'Select a connection' }).click();
  await page.getByLabel('slack').click();

  await page.waitForTimeout(2000);
  await page.locator('button').filter({ hasText: 'Select channel' }).click();

  await page.waitForFunction(() => {
    const channelElement = document.querySelector('body');
    if (channelElement?.textContent && channelElement.textContent.includes('Channel')) {
      return channelElement;
    }
  }, { timeout: 10000 });
  await page.getByText(config.channel).click();

  await page.locator('div').filter({ hasText: /^Message \*The text of your message$/ }).locator('div').nth(3).click()
  await page.locator('div').filter({ hasText: /^Message \*The text of your message$/ }).locator('div').nth(3).fill('Test From checkly');

  // await page.locator('.text-lg > button:nth-child(4)').click();

  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Test Step Ctrl + G' }).click();
  await page.waitForTimeout(8000);

  await page.getByRole('button', { name: 'Test Flow' }).click();
  await page.waitForTimeout(1000);


  const runSuccessLocator = page.locator('text=Run Succeeded');
  const runSuccessText = await runSuccessLocator.textContent({ timeout: 60000 });
  expect(runSuccessText).toContain('Run Succeeded');

  await page.getByRole('button', { name: 'Exit Run' }).click();

  await page.goto(`${config.url}flows`);

});

export async function testSignIn(page, config: { email: string, password: string, url: string }) {
  await page.goto(`${config.url}/sign-in`);
  await page.getByPlaceholder('email@example.com').click();
  await page.getByPlaceholder('email@example.com').fill(config.email);
  await page.getByPlaceholder('********').click();
  await page.getByPlaceholder('********').fill(config.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}