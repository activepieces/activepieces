import { mergeTests } from '@playwright/test';
import { e2eApi } from '../../../fixtures/api';
import { expect, test as accessTest } from '../../../fixtures/access';
import { test as connectionsListTest } from '../../../fixtures/connections-list';
import { ConnectionsPage } from '../../../pages/connections.page';

const test = mergeTests(accessTest, connectionsListTest);

test.describe('Connections', { tag: ['@feature:connections', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('a viewer cannot create a connection: the server refuses', async ({ request, secondProject, viewer, connectionsList, cleanup }) => {
    const path = '/api/v1/app-connections';
    const data = connectionsList.newConnectionRequest({ displayName: e2eApi.uniqueName('connection'), projectId: secondProject.id });

    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path: `${path}?projectId=${secondProject.id}` }), 'The viewer is not a member of the second project').toBe(200);
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'POST', path, data })).toBe(403);
    expect(await connectionsList.findByName({ displayName: data.displayName, session: secondProject.session })).toEqual([]);

    const created = await e2eApi.callApi<{ id: string; displayName: string }>({ request, session: secondProject.session, method: 'POST', path, data });
    cleanup.track({ resource: 'app-connections', id: created.id });
    expect(created.displayName, 'The admin sends the same request and gets the connection').toBe(data.displayName);
  });

  test('connections of a different project do not show', async ({ page, secondProject, connectionsList }) => {
    const prefix = connectionsList.newPrefix();
    const [own] = await connectionsList.seedConnections({ prefix, count: 1 });
    const [other] = await connectionsList.seedConnections({ prefix, count: 1, session: secondProject.session });
    const connectionsPage = new ConnectionsPage(page);

    await connectionsPage.visitWithName(prefix);

    await expect(connectionsPage.row(own.displayName)).toBeVisible();
    await expect(connectionsPage.row(other.displayName)).toBeHidden();
  });
});
