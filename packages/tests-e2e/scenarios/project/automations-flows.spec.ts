import { expect, test } from '../../fixtures/index';
import { listResponse } from '../../fixtures/list-response';
import webhookEcho from '../../fixtures/templates/webhook-echo.json';
import { AutomationsPage } from '../../pages/automations.page';

test.describe('Automations › flows', { tag: '@feature:flows-list' }, () => {
  test('a failed flows request shows the error state', async ({ page, seed }) => {
    const { flowName } = await seed.flow({ template: webhookEcho, publish: false });
    await Promise.all(['folders', 'tables', 'agents'].map((resource) => listResponse.empty({ page, resource })));
    const restoreFlows = await listResponse.fail({ page, resource: 'flows' });
    const automationsPage = new AutomationsPage(page);

    await automationsPage.search(flowName);
    await expect(automationsPage.errorState()).toBeVisible({ timeout: listResponse.ERROR_STATE_TIMEOUT_MS });
    await expect(automationsPage.row(flowName)).toBeHidden();

    await restoreFlows();
    await automationsPage.retryAfterError();
    await expect(automationsPage.row(flowName)).toBeVisible();
    await expect(automationsPage.errorState()).toBeHidden();
  });
});
