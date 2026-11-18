import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession } from '../../fixtures/api';
import { expect, test } from '../../fixtures/flows-list';
import { FoldersPage } from '../../pages/folders.page';

test.describe('Automations › folders', { tag: ['@feature:folders', '@surface'] }, () => {
  test('create a folder, move a flow into it, rename it and delete it', async ({ page, request, session, cleanup, flowsList }) => {
    const prefix = flowsList.newPrefix();
    const [{ flowId, flowName }] = await flowsList.seedFlows({ prefix, count: 1, publish: false });
    const folderName = e2eApi.uniqueName(`${prefix} folder`);
    const newName = `${folderName} renamed`;
    const foldersPage = new FoldersPage(page);
    await foldersPage.searchFlows(prefix);
    await expect(foldersPage.row(flowName)).toBeVisible();

    const folderId = await test.step('Create the folder', async () => {
      const id = await foldersPage.createFolder(folderName);
      cleanup.track({ resource: 'folders', id });
      await expect(foldersPage.row(folderName)).toBeVisible();
      expect((await readFolder({ request, session, folderId: id })).displayName).toBe(folderName);
      return id;
    });

    await test.step('Move the flow into the folder, and it stays there after reload', async () => {
      await foldersPage.moveFlowTo({ flowName, folderName });
      await expect.poll(async () => (await readFlow({ request, session, flowId })).folderId).toBe(folderId);
      await expect(foldersPage.rowContainer(folderName)).toContainText('1 file');

      await page.reload();
      await expect(foldersPage.rowContainer(folderName)).toContainText('1 file');
      await expect(foldersPage.row(flowName)).toBeVisible();
    });

    await test.step('Rename the folder', async () => {
      await foldersPage.renameFolder({ from: folderName, to: newName });
      await expect(foldersPage.row(newName)).toBeVisible();
      await expect(foldersPage.row(folderName)).toBeHidden();
      await expect.poll(async () => (await readFolder({ request, session, folderId })).displayName).toBe(newName);
    });

    await test.step('Delete the folder, and its flow stays', async () => {
      await foldersPage.deleteFolder(newName);
      await expect(foldersPage.row(newName)).toBeHidden();
      await expect(foldersPage.row(flowName)).toBeVisible();
      expect(await e2eApi.callApiStatus({ request, session, method: 'GET', path: `/api/v1/folders/${folderId}` })).toBe(404);
      expect((await readFlow({ request, session, flowId })).folderId).toBeNull();
    });
  });

  test('a folder with an empty name shows an error', async ({ page, cleanup }) => {
    const folderName = e2eApi.uniqueName('folder');
    const foldersPage = new FoldersPage(page);
    await foldersPage.searchFlows(folderName);
    const folderCreates = foldersPage.countFolderCreates();
    await foldersPage.openCreateFolderDialog();

    await foldersPage.submitFolderName('');
    await foldersPage.expectFolderNameMissing();
    await expect(foldersPage.createFolderDialog()).toBeVisible();

    await foldersPage.submitFolderName('   ');
    await expect(foldersPage.folderNameError()).toHaveText('Please enter folder name');
    await expect(foldersPage.createFolderDialog()).toBeVisible();
    expect(folderCreates()).toBe(0);

    const folderId = await foldersPage.confirmFolderName(folderName);
    cleanup.track({ resource: 'folders', id: folderId });
    await expect(foldersPage.row(folderName)).toBeVisible();
    expect(folderCreates()).toBe(1);
  });
});

async function readFlow({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }) {
  return e2eApi.callApi<{ folderId: string | null }>({ request, session, method: 'GET', path: `/api/v1/flows/${flowId}` });
}

async function readFolder({ request, session, folderId }: { request: APIRequestContext; session: E2eSession; folderId: string }) {
  return e2eApi.callApi<{ displayName: string }>({ request, session, method: 'GET', path: `/api/v1/folders/${folderId}` });
}
