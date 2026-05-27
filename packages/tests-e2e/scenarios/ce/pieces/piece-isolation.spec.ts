import { test, expect } from '../../../fixtures';

/**
 * Warmup resilience smoke test.
 *
 * Triggers a piece sync (which may cause warmup for some pieces) and then
 * verifies the worker remains healthy by successfully running a Webhook flow.
 * A broken piece published with workspace:* dependencies must not prevent other
 * flows from executing.
 */
test.describe('Piece isolation — CE', () => {
  test('worker stays healthy after piece sync and can execute a webhook flow', async ({ page, automationsPage, builderPage, request }) => {
    test.setTimeout(120000);

    // Trigger a piece sync — this exercises the warmup path
    const token = await page.evaluate(() => localStorage.getItem('token'));
    await request.post('/api/v1/pieces/sync', {
      headers: { Authorization: `Bearer ${token}` },
    });

    await automationsPage.waitFor();
    await automationsPage.newFlowFromScratch();

    await builderPage.selectInitialTrigger({
      piece: 'Webhook',
      trigger: 'Catch Webhook'
    });

    const webhookInput = page.locator('input.grow.bg-background');
    const webhookUrl = await webhookInput.inputValue();

    await builderPage.testTrigger();

    const runVersion = Math.floor(Math.random() * 100000);
    await page.context().request.get(`${webhookUrl}?runVersion=${runVersion}`);
    await page.waitForTimeout(3000);

    await builderPage.addAction({
      piece: 'Webhook',
      action: 'Return Response'
    });

    await page.locator('div.cm-activeLine.cm-line').fill('');
    await page.locator('div.cm-activeLine.cm-line').fill(
      '{"runVersion": "{{trigger[\'queryParams\'][\'runVersion\']}}"}'
    );

    await page.waitForTimeout(1000);
    await builderPage.publishFlow();

    const response = await page.context().request.get(`${webhookUrl}/sync?runVersion=${runVersion}`);
    const body = await response.json();

    expect(body.runVersion).toBe(runVersion.toString());
  });
});
