import { expect, test } from '../../../fixtures/access';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';

test.describe('Access fixtures', { tag: '@feature:access-fixtures' }, () => {
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
