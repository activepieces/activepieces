import { expect, test } from '../../../fixtures/access';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';

test.describe('Access fixtures', { tag: '@feature:access-fixtures' }, () => {
  test('a viewer cannot delete a flow: the server refuses', async ({ request, seed, secondProject, viewer }) => {
    const { flowId } = await seed.flow({ template: webhookEcho, publish: false, session: secondProject.session });

    const viewerHeaders = { Authorization: `Bearer ${viewer.session.token}` };
    const viewerRead = await request.get(`/api/v1/flows/${flowId}`, { headers: viewerHeaders });
    expect(viewerRead.status(), 'The viewer is not a member of the second project').toBe(200);

    const viewerDelete = await request.delete(`/api/v1/flows/${flowId}`, { headers: viewerHeaders });
    expect(viewerDelete.status()).toBe(403);

    const flow = await request.get(`/api/v1/flows/${flowId}`, { headers: { Authorization: `Bearer ${secondProject.session.token}` } });
    expect(flow.status()).toBe(200);
  });

  test('a member of another project cannot read or list the flows of this project', async ({ request, session, seed, viewer }) => {
    const { flowId } = await seed.flow({ template: webhookEcho, publish: false });

    const adminRead = await request.get(`/api/v1/flows/${flowId}`, { headers: { Authorization: `Bearer ${session.token}` } });
    expect(adminRead.status(), 'The admin cannot read the flow it seeded').toBe(200);

    const outsiderHeaders = { Authorization: `Bearer ${viewer.session.token}` };
    const outsiderRead = await request.get(`/api/v1/flows/${flowId}`, { headers: outsiderHeaders });
    expect(outsiderRead.status()).toBe(403);

    const outsiderList = await request.get('/api/v1/flows', { headers: outsiderHeaders, params: { projectId: session.projectId } });
    expect(outsiderList.status()).toBe(403);
  });
});
