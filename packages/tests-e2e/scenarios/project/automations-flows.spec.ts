import { mergeTests } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession } from '../../fixtures/api';
import { e2eFlows } from '../../fixtures/flows';
import { test as flowsListTest } from '../../fixtures/flows-list';
import { expect, test as listResponseTest } from '../../fixtures/list-response';
import webhookEcho from '../../fixtures/templates/webhook-echo.json';
import { AutomationsPage } from '../../pages/automations.page';

const test = mergeTests(listResponseTest, flowsListTest);

test.describe('Automations › flows', { tag: ['@feature:flows-list', '@surface'] }, () => {
  test('rename, duplicate, export and import a flow', async ({ page, request, session, seed, cleanup }) => {
    const { flowId, flowName } = await seed.flow({ template: webhookEcho, publish: false });
    const newName = `${flowName} renamed`;
    const automationsPage = new AutomationsPage(page);
    await automationsPage.searchFlows(flowName);

    await test.step('Rename the flow', async () => {
      await automationsPage.renameFlow({ from: flowName, to: newName });
      await expect(automationsPage.row(newName)).toBeVisible();
      await expect(automationsPage.row(flowName)).toBeHidden();
      const renamed = await readFlow({ request, session, flowId });
      expect(renamed.version.displayName).toBe(newName);
    });

    await test.step('Duplicate the flow', async () => {
      const copyId = await automationsPage.duplicateFlow(newName);
      cleanup.track({ resource: 'flows', id: copyId });
      await expect(automationsPage.row(`${newName} - Copy`)).toBeVisible();
    });

    const exported = await test.step('Export the flow', async () => {
      const download = await automationsPage.exportFlow(newName);
      expect(download.template.name).toBe(newName);
      expect(download.template.flows.map((flow) => flow.displayName)).toEqual([newName]);
      return download;
    });

    await test.step('Import the exported file', async () => {
      const importedId = await automationsPage.importFlow(exported.file);
      cleanup.track({ resource: 'flows', id: importedId });
      const imported = await readFlow({ request, session, flowId: importedId });
      expect(imported.version).toMatchObject({
        displayName: newName,
        trigger: { settings: { pieceName: '@activepieces/piece-webhook', triggerName: 'catch_webhook' } },
      });
    });
  });

  test('delete a flow, and it stays deleted after reload', async ({ page, request, session, seed }) => {
    const { flowId, flowName } = await seed.flow({ template: webhookEcho, publish: false });
    const automationsPage = new AutomationsPage(page);
    await automationsPage.searchFlows(flowName);

    await automationsPage.deleteFlow(flowName);
    await expect(automationsPage.row(flowName)).toBeHidden();

    await page.reload();
    await expect(automationsPage.noResults()).toBeVisible();
    await expect(automationsPage.row(flowName)).toBeHidden();
    expect(await flowStatusCode({ request, session, flowId })).toBe(404);
  });

  test('an import of a file that is not a flow shows an error', async ({ page }) => {
    const automationsPage = new AutomationsPage(page);
    await automationsPage.visitFlows();

    await automationsPage.submitImport({ name: 'not-a-flow.json', mimeType: 'application/json', buffer: Buffer.from('{"name":"not a flow"}') });

    await expect(automationsPage.importError()).toContainText('No valid templates found');
    await expect(automationsPage.importError()).toContainText('not-a-flow.json');
    await expect(page).toHaveURL(/\/automations/);
  });

  test('move and delete the selected flows in bulk', async ({ page, request, session, flowsList }) => {
    const prefix = flowsList.newPrefix();
    const flows = await flowsList.seedFlows({ prefix, count: 2, publish: false });
    const folder = await flowsList.createFolder();
    const names = flows.map((flow) => flow.flowName);
    const flowIds = flows.map((flow) => flow.flowId);
    const automationsPage = new AutomationsPage(page);
    await automationsPage.searchFlows(prefix);

    await test.step('Move the selected flows to a folder', async () => {
      await automationsPage.selectFlows(names);
      await automationsPage.moveSelectedTo(folder.displayName);
      await expect.poll(async () => (await Promise.all(flowIds.map((flowId) => readFlow({ request, session, flowId })))).map((flow) => flow.folderId))
        .toEqual([folder.id, folder.id]);
      await expect(automationsPage.row(folder.displayName)).toBeVisible();
    });

    await test.step('Delete the selected flows', async () => {
      await automationsPage.selectFlows(names);
      await automationsPage.deleteSelected();
      await expect(automationsPage.noResults()).toBeVisible();
      expect(await Promise.all(flowIds.map((flowId) => flowStatusCode({ request, session, flowId })))).toEqual([404, 404]);
    });
  });

  test('the flows table pages, filters and searches by the spec prefix', async ({ page, seed, flowsList }) => {
    const prefix = flowsList.newPrefix();
    await flowsList.seedFlows({ prefix, count: PAGE_SIZE, publish: false });
    const [published] = await flowsList.seedFlows({ prefix, count: 1, publish: true });
    const unmatched = await seed.flow({ template: webhookEcho, publish: false });
    const automationsPage = new AutomationsPage(page);
    await automationsPage.visitFlows();

    await automationsPage.typeSearch(prefix);
    await expect(automationsPage.rowsMatching(prefix)).toHaveCount(PAGE_SIZE);
    await expect(automationsPage.row(unmatched.flowName)).toBeHidden();

    await automationsPage.nextPage();
    await expect(automationsPage.rowsMatching(prefix)).toHaveCount(1);
    await expect(automationsPage.row(published.flowName)).toBeHidden();

    await automationsPage.filterByStatus('Enabled');
    await expect(automationsPage.row(published.flowName)).toBeVisible();
    await expect(automationsPage.rowsMatching(prefix)).toHaveCount(1);

    await page.reload();
    await expect(automationsPage.searchInput()).toHaveValue(prefix);
    await expect(automationsPage.row(published.flowName)).toBeVisible();
    await expect(automationsPage.rowsMatching(prefix)).toHaveCount(1);
  });

  test('a flows filter with no match shows the empty state', async ({ page }) => {
    const automationsPage = new AutomationsPage(page);

    await automationsPage.searchFlows(e2eFlows.uniqueName('no match'));

    await expect(automationsPage.noResults()).toBeVisible();
  });

  test('a failed flows request shows the error state', async ({ page, seed, listResponse }) => {
    const { flowName } = await seed.flow({ template: webhookEcho, publish: false });
    await listResponse.empty({ resource: 'folders' });
    const restoreFlows = await listResponse.fail({ resource: 'flows' });
    const automationsPage = new AutomationsPage(page);

    await automationsPage.searchFlows(flowName);
    await expect(automationsPage.errorState()).toBeVisible({ timeout: listResponse.ERROR_STATE_TIMEOUT_MS });

    await restoreFlows();
    await automationsPage.retryAfterError();
    await expect(automationsPage.row(flowName)).toBeVisible();
    await expect(automationsPage.errorState()).toBeHidden();
  });
});

async function readFlow({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }) {
  return e2eApi.callApi<FlowDetails>({ request, session, method: 'GET', path: `/api/v1/flows/${flowId}` });
}

async function flowStatusCode({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }) {
  return e2eApi.callApiStatus({ request, session, method: 'GET', path: `/api/v1/flows/${flowId}` });
}

const PAGE_SIZE = 10;

type FlowDetails = { folderId: string | null; version: { displayName: string; trigger: unknown } };
