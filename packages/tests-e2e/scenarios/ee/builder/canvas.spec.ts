import { e2eApi } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/access';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';
import { BuilderPage } from '../../../pages/builder.page';

test.describe('Canvas', { tag: ['@feature:canvas', '@surface'] }, () => {
  test('a viewer opens the flow read-only, and the server refuses an edit', async ({ browser, baseURL, request, seed, secondProject, viewer }) => {
    const { flowId } = await seed.flow({ template: webhookEcho, publish: false, session: secondProject.session });
    const path = `/api/v1/flows/${flowId}`;
    const deleteStep = { type: 'DELETE_ACTION', request: { names: ['step_1'] } };

    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path }), 'The viewer is not a member of the second project').toBe(200);
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'POST', path, data: deleteStep })).toBe(403);

    const viewerContext = await browser.newContext({
      baseURL,
      storageState: {
        cookies: [],
        origins: [{ origin: new URL(baseURL ?? '').origin, localStorage: [{ name: 'token', value: viewer.session.token }, { name: 'projectId', value: secondProject.id }] }],
      },
    });
    const builderPage = new BuilderPage(await viewerContext.newPage());
    await builderPage.visitFlow(flowId);
    await expect(builderPage.step('step_1')).toBeVisible();
    await expect(builderPage.page.getByTestId('add-action-button')).toHaveCount(0);
    await expect(builderPage.page.getByRole('button', { name: 'Add note', exact: true })).toBeHidden();
    await viewerContext.close();

    expect(await e2eApi.callApiStatus({ request, session: secondProject.session, method: 'POST', path, data: deleteStep }), 'The admin sends the same edit and the server accepts it').toBe(200);
  });
});
