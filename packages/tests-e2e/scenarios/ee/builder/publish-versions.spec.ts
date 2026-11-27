import { e2eApi } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/access';
import { PUBLISH } from '../../../fixtures/publish-versions';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';

test.describe('Publish and versions', { tag: ['@feature:publish', '@surface'] }, () => {
  test('a viewer cannot publish a flow: the server refuses', async ({ request, seed, secondProject, viewer }) => {
    const { flowId } = await seed.flow({ template: webhookEcho, publish: false, session: secondProject.session });
    const path = `/api/v1/flows/${flowId}`;

    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path }), 'The viewer is not a member of the second project').toBe(200);
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'POST', path, data: PUBLISH })).toBe(403);
    expect(await e2eApi.callApiStatus({ request, session: secondProject.session, method: 'POST', path, data: PUBLISH }), 'The admin sends the same publish and the server accepts it').toBe(200);
  });
});
