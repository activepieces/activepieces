import { mergeTests } from '@playwright/test';
import { e2eApi } from '../../../fixtures/api';
import { expect, test as accessTest } from '../../../fixtures/access';
import { test as flowsListTest } from '../../../fixtures/flows-list';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';
import { AutomationsPage } from '../../../pages/automations.page';

const test = mergeTests(accessTest, flowsListTest);

test.describe('Automations › flows', { tag: ['@feature:flows-list', '@surface'] }, () => {
  test('a viewer cannot delete a flow: the server refuses', async ({ request, seed, secondProject, viewer }) => {
    const { flowId } = await seed.flow({ template: webhookEcho, publish: false, session: secondProject.session });
    const path = `/api/v1/flows/${flowId}`;

    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path }), 'The viewer is not a member of the second project').toBe(200);
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'DELETE', path })).toBe(403);
    expect(await e2eApi.callApiStatus({ request, session: secondProject.session, method: 'GET', path })).toBe(200);
  });

  test('flows of a different project do not show', async ({ page, secondProject, flowsList }) => {
    const prefix = flowsList.newPrefix();
    const [ownFlow] = await flowsList.seedFlows({ prefix, count: 1, publish: false });
    const [otherFlow] = await flowsList.seedFlows({ prefix, count: 1, publish: false, session: secondProject.session });
    const automationsPage = new AutomationsPage(page);

    await automationsPage.searchFlows(prefix);

    await expect(automationsPage.row(ownFlow.flowName)).toBeVisible();
    await expect(automationsPage.row(otherFlow.flowName)).toBeHidden();
    await expect(automationsPage.rowsMatching(prefix)).toHaveCount(1);
  });
});
