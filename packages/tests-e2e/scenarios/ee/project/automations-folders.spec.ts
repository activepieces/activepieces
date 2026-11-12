import { e2eApi } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/access';

test.describe('Automations › folders', { tag: ['@feature:folders', '@surface'] }, () => {
  test('a viewer cannot create a folder: the server refuses', async ({ request, secondProject, viewer }) => {
    const path = '/api/v1/folders';
    const data = { displayName: e2eApi.uniqueName('folder'), projectId: secondProject.id };

    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path: `${path}?projectId=${secondProject.id}` }), 'The viewer is not a member of the second project').toBe(200);
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'POST', path, data })).toBe(403);

    const listed = await e2eApi.callApi<{ data: { displayName: string }[] }>({ request, session: secondProject.session, method: 'GET', path, params: { projectId: secondProject.id } });
    expect(listed.data.map((folder) => folder.displayName)).not.toContain(data.displayName);

    const created = await e2eApi.callApi<{ displayName: string }>({ request, session: secondProject.session, method: 'POST', path, data });
    expect(created.displayName, 'The admin sends the same request and gets the folder').toBe(data.displayName);
  });
});
