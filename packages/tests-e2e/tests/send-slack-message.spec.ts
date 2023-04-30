import { expect, test } from '@playwright/test';
import { testSignIn, getEnvOrThrow } from '../helper/test-utils';

// The account must be empty, and no flows should be present otherwise the test will fail and has a slack connection
const config = {
  email: getEnvOrThrow('AP_TEST_EMAIL'),
  password: getEnvOrThrow('AP_TEST_PASSWORD'),
  channel: getEnvOrThrow('AP_TEST_CHANNEL'),
  url: getEnvOrThrow('AP_TEST_URL'),
};

test('Test Send Slack message', async ({ page }) => {

  test.setTimeout(50000);
  
  await testSignIn(page, config);

  await page.getByRole('button', { name: 'Start building' }).click();
  await page.getByRole('navigation').locator('svg').nth(2).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await page.getByText('Untitled').fill('Slack');
  await page.getByText('Select Trigger').click();
  await page.getByText('Webhook').click();

  await page.click('.add-button.ap-cursor-pointer.ap-absolute');
  await page.getByPlaceholder('Search').click();
  await page.getByPlaceholder('Search').fill('Slack');

  await page.locator('app-step-type-item div').filter({ hasText: 'Slack' }).first().click();
  await page.getByText('Select an action').click();
  await page.getByText('Send Message To A Channel', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Authentication' }).locator('span').click();
  await page.getByText('slack', { exact: true }).click();
  await page.waitForFunction(() => {
    const channelElement = document.querySelector('body');
    if (channelElement?.textContent && channelElement.textContent.includes('Channel')) {
      return channelElement;
    }
  }, { timeout: 5000 });
  await page.getByText('Channel', { exact: true }).click()
  await page.getByText(config.channel).click();
  
  await page.locator('#custom-form-field-id-0').getByRole('paragraph').click();
  await page.locator('#custom-form-field-id-0 div').nth(1).fill('Test from Checkly');


  await page.getByRole('button', { name: 'Test flow' }).click();
  await page.getByRole('button', { name: 'Test' }).click();
  await page.waitForFunction(() => {
    const elements = document.querySelectorAll('*');
    for (let i = 0; i < elements.length; i++) {
      const txt = elements[i].textContent;
      if (txt && txt.includes('Run succeeded')) {
        return true;
      }
    }
    return false;
  });
  const runSuccessText = await page.locator('//*[contains(text(),"Run succeeded")]').textContent();
  expect(runSuccessText).toContain('Run succeeded');

  await page.getByRole('button', { name: 'Exit Run' }).click();
  await page.getByRole('button', { name: 'Home' }).click();
  await page.getByRole('table', { name: 'Flows' }).getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByPlaceholder('DELETE').fill('DELETE');
  await page.getByRole('button', { name: 'Confirm' }).click();
});

