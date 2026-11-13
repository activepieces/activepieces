import { expect, test } from '../../fixtures/list-response';
import webhookEcho from '../../fixtures/templates/webhook-echo.json';
import { AutomationsPage } from '../../pages/automations.page';

test.describe('Automations › flows', { tag: '@feature:flows-list' }, () => {
  test('a failed flows request shows the error state', async ({ page, seed, listResponse }) => {
    const { flowName } = await seed.flow({ template: webhookEcho, publish: false });
    await listResponse.empty({ resource: 'folders' });
    const restoreFlows = await listResponse.fail({ resource: 'flows' });
    const automationsPage = new AutomationsPage(page);

    await automationsPage.searchFlows(flowName);
    await expect(automationsPage.errorState()).toBeVisible({ timeout: listResponse.ERROR_STATE_TIMEOUT_MS });

    await restoreFlows();
    await automationsPage.retryAfterError();
    await expect(automationsPage.row(flowName)).toBeVisible();
    await expect(automationsPage.errorState()).toBeHidden();
  });
});
