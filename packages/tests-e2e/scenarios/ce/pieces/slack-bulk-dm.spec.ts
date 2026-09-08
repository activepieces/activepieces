import { expect } from '@playwright/test';
import { test } from '../../../fixtures';

/**
 * Send Message To Multiple Users — builder surface.
 *
 * The send behaviour is covered by the piece unit suite. What only the builder
 * can prove is that the action is reachable and that its DynamicProperties swap
 * the recipient fields when Message Mode changes, so this spec stays on the
 * form and never sends a real DM.
 *
 * The action is picked without BuilderPage.addAction, which resolves the action
 * name with .nth(1) and so requires the name to appear twice in the picker.
 * This action's name appears once.
 */
test.describe('Slack bulk DM — CE', () => {
  test('the action renders and its recipient fields follow Message Mode', async ({
    page,
    automationsPage,
    builderPage,
  }) => {
    test.setTimeout(120000);

    await automationsPage.waitFor();
    await automationsPage.newFlowFromScratch();

    await builderPage.selectInitialTrigger({
      piece: 'Webhook',
      trigger: 'Catch Webhook',
    });

    await page.getByTestId('add-action-button').click();
    await page.getByTestId('pieces-search-input').fill('Slack');
    await page.getByTestId('Slack').first().click();
    await page.getByText('Send Message To Multiple Users').first().click();

    await expect(page.getByText('Message Mode')).toBeVisible();
    await expect(page.getByText('Parallel Sends')).toBeVisible();
    await expect(page.getByText('Same message for everyone')).toBeVisible();

    await expect(page.getByText('Users And Messages')).toHaveCount(0);

    await page.getByText('Same message for everyone').click();
    await page.getByText('Personal message per user').click();

    await expect(page.getByText('Users And Messages')).toBeVisible();

    await page.getByText('Personal message per user').click();
    await page.getByText('Same message for everyone').click();

    await expect(page.getByText('Users And Messages')).toHaveCount(0);
    await expect(page.getByText('Parallel Sends')).toBeVisible();
  });
});
