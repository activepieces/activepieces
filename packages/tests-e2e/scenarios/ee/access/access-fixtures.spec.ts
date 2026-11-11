import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../../../fixtures/access';
import { E2eSession } from '../../../fixtures/api';
import { e2eFlows } from '../../../fixtures/flows';

test.describe('Access fixtures', { tag: '@feature:access-fixtures' }, () => {
  test('a viewer cannot delete a flow: the server refuses', async ({ request, secondProject, viewer, cleanup }) => {
    const flowId = await createFlow({ request, session: secondProject.session, name: e2eFlows.uniqueName('viewer target') });
    cleanup.track({ resource: 'flows', id: flowId });

    const viewerHeaders = { Authorization: `Bearer ${viewer.session.token}` };
    const viewerRead = await request.get(`/api/v1/flows/${flowId}`, { headers: viewerHeaders });
    expect(viewerRead.status(), 'The viewer is not a member of the second project').toBe(200);

    const viewerDelete = await request.delete(`/api/v1/flows/${flowId}`, { headers: viewerHeaders });
    expect(viewerDelete.status()).toBe(403);

    const flow = await request.get(`/api/v1/flows/${flowId}`, { headers: { Authorization: `Bearer ${secondProject.session.token}` } });
    expect(flow.status()).toBe(200);
  });

  test('a second project does not list the flows of the first project', async ({ request, session, secondProject, cleanup }) => {
    const name = e2eFlows.uniqueName('isolation');
    const flowId = await createFlow({ request, session, name });
    cleanup.track({ resource: 'flows', id: flowId });

    expect(await listFlowIds({ request, session, name })).toContain(flowId);
    expect(await listFlowIds({ request, session: secondProject.session, name })).not.toContain(flowId);
  });
});

async function listFlowIds({ request, session, name }: { request: APIRequestContext; session: E2eSession; name: string }): Promise<string[]> {
  const response = await request.get('/api/v1/flows', {
    headers: { Authorization: `Bearer ${session.token}` },
    params: { projectId: session.projectId, name, limit: 10 },
  });
  expect(response.ok(), `Listing flows failed with ${response.status()}`).toBe(true);
  const page: { data: { id: string }[] } = await response.json();
  return page.data.map(({ id }) => id);
}

async function createFlow({ request, session, name }: { request: APIRequestContext; session: E2eSession; name: string }): Promise<string> {
  const response = await request.post('/api/v1/flows', {
    headers: { Authorization: `Bearer ${session.token}` },
    data: { displayName: name, projectId: session.projectId },
  });
  expect(response.ok(), `Creating the flow failed with ${response.status()}: ${await response.text()}`).toBe(true);
  const flow: { id: string } = await response.json();
  return flow.id;
}
