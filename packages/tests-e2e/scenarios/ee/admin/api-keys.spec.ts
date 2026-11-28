import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../../../fixtures/access';
import { e2eApi } from '../../../fixtures/api';
import { ApiKeysPage } from '../../../pages/api-keys.page';

test.describe('API keys', { tag: ['@feature:api-keys', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('create an API key and call the API with it', async ({ page, request, session, cleanup }) => {
    const name = e2eApi.uniqueName('api key');
    const apiKeysPage = new ApiKeysPage(page);
    await apiKeysPage.open();

    await apiKeysPage.openCreateDialog();
    const key = await apiKeysPage.confirmName(name);
    cleanup.track({ resource: 'api-keys', id: key.id });

    expect(await listFlowsStatus({ request, token: key.value, projectId: session.projectId })).toBe(200);
    expect(await apiKeysPage.reload()).toContain(key.id);
    await expect(apiKeysPage.row(name)).toContainText('Last used');
  });

  test('delete the key and the API refuses it', async ({ page, request, session, cleanup, viewer }) => {
    const name = e2eApi.uniqueName('api key');
    const key = await e2eApi.callApi<{ id: string; value: string }>({ request, session, method: 'POST', path: '/api/v1/api-keys', data: { displayName: name } });
    cleanup.track({ resource: 'api-keys', id: key.id });
    expect(await listFlowsStatus({ request, token: key.value, projectId: session.projectId })).toBe(200);

    expect(await listFlowsStatus({ request, token: viewer.session.token, projectId: viewer.session.projectId }), 'The viewer cannot read the flows of its own project').toBe(200);
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'POST', path: '/api/v1/api-keys', data: { displayName: name } })).toBe(403);
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'DELETE', path: `/api/v1/api-keys/${key.id}` })).toBe(403);

    const apiKeysPage = new ApiKeysPage(page);
    await apiKeysPage.open();
    await apiKeysPage.revoke(name);

    expect(await listFlowsStatus({ request, token: key.value, projectId: session.projectId })).toBe(401);
    expect(await apiKeysPage.reload()).not.toContain(key.id);
    await expect(apiKeysPage.row(name)).toBeHidden();
  });

  test('a key with no name shows an error', async ({ page, cleanup }) => {
    const apiKeysPage = new ApiKeysPage(page);
    await apiKeysPage.open();
    const keyCreates = apiKeysPage.countKeyCreates();
    await apiKeysPage.openCreateDialog();

    await apiKeysPage.submitName('');
    await apiKeysPage.expectNameMissing();
    await expect(apiKeysPage.createDialog()).toBeVisible();
    expect(keyCreates()).toBe(0);

    const name = e2eApi.uniqueName('api key');
    const key = await apiKeysPage.confirmName(name);
    cleanup.track({ resource: 'api-keys', id: key.id });
    await expect(apiKeysPage.row(name)).toBeVisible();
    expect(keyCreates()).toBe(1);
  });
});

async function listFlowsStatus({ request, token, projectId }: { request: APIRequestContext; token: string; projectId: string }): Promise<number> {
  return e2eApi.callApiStatus({ request, session: { token, projectId }, method: 'GET', path: `/api/v1/flows?projectId=${projectId}&limit=1` });
}
