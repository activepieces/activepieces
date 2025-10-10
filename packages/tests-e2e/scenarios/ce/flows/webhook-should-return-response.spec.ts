import { test, expect } from '../../../fixtures';

test.describe('Webhooks', () => {
  test('should handle webhook with return response', async ({ page, flowsPage, builderPage }) => {
    test.setTimeout(120000);

    await flowsPage.waitFor();

    await flowsPage.newFlowFromScratch();

    await builderPage.selectInitialTrigger({
      piece: 'Webhook',
      trigger: 'Catch Webhook'
    });

    const webhookInput = page.locator('input.grow.bg-background');
    const webhookUrl = await webhookInput.inputValue();
    const runVersion = Math.floor(Math.random() * 100000);
    const urlWithParams = `${webhookUrl}/sync?targetRunVersion=${runVersion}`;

    await builderPage.testTrigger();

    await page.context().request.get(urlWithParams);
    await page.waitForTimeout(5000);

    await builderPage.addAction({
      piece: 'Webhook',
      action: 'Return Response'
    });

    await page.locator('div.cm-activeLine.cm-line').fill(
      '{"targetRunVersion": "{{trigger[\'queryParams\'][\'targetRunVersion\']}}"}'
    );

    await page.waitForTimeout(1000);
    await builderPage.publishFlow();

    const response = await page.context().request.get(urlWithParams);
    const body = await response.json();

    expect(body.targetRunVersion).toBe(runVersion.toString());
  });

}); 