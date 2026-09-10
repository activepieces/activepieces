import { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';

const PIECE = 'Floqer';
const CONNECTION_LABEL = 'Floqer';

async function pickFloqer(page: Page, entry: string) {
  await page.getByTestId('pieces-search-input').fill(PIECE);
  await page.getByTestId(PIECE).click();
  await page.getByText(entry, { exact: false }).first().click();
}

async function selectConnection(page: Page) {
  const picker = page.getByTestId('select-connection-value');
  await expect(picker).toBeVisible({ timeout: 30000 });
  await picker.click();
  await page.getByRole('option', { name: CONNECTION_LABEL, exact: true }).click();
  await expect(page.getByText('Connected').first()).toBeVisible({ timeout: 30000 });
}

// Opt-in. This suite needs the Floqer piece in AP_DEV_PIECES *and* a live
// Floqer connection in the project, neither of which CI has — its e2e workflow
// runs with AP_DEV_PIECES=store,webhook. Run it locally with:
//
//   FLOQER_E2E=1 E2E_EMAIL=... E2E_PASSWORD=... \
//     ./node_modules/.bin/playwright test scenarios/ce/pieces/floqer.spec.ts
//
// (use the workspace playwright binary — `npx playwright` resolves to a
// different version and fails with "did not expect test.describe()".)
test.skip(
  !process.env.FLOQER_E2E,
  'needs FLOQER_E2E=1, the Floqer piece in AP_DEV_PIECES, and a Floqer connection',
);

test.describe('Floqer piece — builder', () => {
  test('Add Rows renders its props, gates Sheet on Workflow, and defaults to not running', async ({
    page,
    automationsPage,
    builderPage,
  }) => {
    test.setTimeout(180000);

    await automationsPage.waitFor();
    await automationsPage.newFlowFromScratch();
    await builderPage.waitFor();

    // Any trigger will do — the piece ships none. Webhook is always loaded, so
    // it scaffolds the flow that holds the action under test.
    await builderPage.selectInitialTrigger({ piece: 'Webhook', trigger: 'Catch Webhook' });

    await page.getByTestId('add-action-button').click();
    await pickFloqer(page, 'Add Rows');
    await selectConnection(page);

    await expect(page.getByText('Workflow', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Rows', { exact: false }).first()).toBeVisible();

    // Sheet is gated on Workflow through its refresher, and has to say so
    // rather than sit empty or throw.
    await expect(
      page.getByText('Select a workflow first.'),
    ).toBeVisible({ timeout: 30000 });

    // Run After Adding must default to the free option — defaulting it to
    // "all" would spend Floqer credits on every run.
    await expect(page.getByText('Do not run', { exact: false }).first()).toBeVisible();
  });
});
