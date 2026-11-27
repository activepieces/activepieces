import { mergeTests } from '@playwright/test';
import { e2eApi } from '../../../fixtures/api';
import { expect, test as accessTest } from '../../../fixtures/access';
import { test as projectSettingsTest } from '../../../fixtures/project-settings';
import formSubmit from '../../../fixtures/templates/form-submit.json';
import { ProjectSettingsPage } from '../../../pages/project-settings.page';

const test = mergeTests(accessTest, projectSettingsTest);

test.describe('Project settings', { tag: ['@feature:settings', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('rename the project in the general settings', async ({ page, request, session, secondProject }) => {
    const newName = e2eApi.uniqueName('renamed');
    const settingsPage = new ProjectSettingsPage(page);

    await settingsPage.visitProject(secondProject.id);
    await settingsPage.renameCurrentProject({ projectId: secondProject.id, displayName: newName });
    await page.reload();
    await settingsPage.openSettings();

    await expect(settingsPage.nameInput()).toHaveValue(newName);
    const saved = await e2eApi.callApi<{ displayName: string }>({ request, session, method: 'GET', path: `/api/v1/projects/${secondProject.id}` });
    expect(saved.displayName).toBe(newName);
  });

  test('hide a piece for the project and the builder does not show it', async ({ page, session, seed, secondProject, pieceSets }) => {
    const { flowId } = await seed.flow({ template: formSubmit, publish: false, session: secondProject.session });
    const pieceSet = await pieceSets.hidePiece({ projectId: secondProject.id, pieceName: STORAGE.name });
    const settingsPage = new ProjectSettingsPage(page);

    await settingsPage.visitProject(secondProject.id);
    await settingsPage.openSettings();
    await settingsPage.openTab('pieces');
    await expect(settingsPage.pieceSetBadge()).toHaveText(pieceSet.name);
    await expect(settingsPage.pieceRow(HTTP.name)).toBeVisible();
    await expect(settingsPage.pieceRow(STORAGE.name)).toHaveCount(0);

    await settingsPage.openFlow({ projectId: secondProject.id, flowId });
    await settingsPage.openStepPickerOfTriggerOnlyFlow();
    await settingsPage.searchPieces(HTTP.displayName);
    await expect(settingsPage.pieceCard(HTTP.displayName)).toBeVisible();
    await settingsPage.searchPieces(STORAGE.displayName);
    await expect(settingsPage.noPiecesFound()).toBeVisible();
    await expect(settingsPage.pieceCard(STORAGE.displayName)).toHaveCount(0);

    const applied = await pieceSets.readForProject({ projectId: secondProject.id });
    expect(applied.id).toBe(pieceSet.id);
    expect(applied.config.pieces.exceptions).toEqual([STORAGE.name]);
    expect(await pieceSets.pieceNames({ session: secondProject.session })).not.toContain(STORAGE.name);
    expect(await pieceSets.pieceNames({ session }), 'The hide reached the default project').toContain(STORAGE.name);
  });

  test('a viewer cannot change the project settings: the server refuses', async ({ request, session, secondProject, viewer, pieceSets }) => {
    const path = `/api/v1/projects/${secondProject.id}`;
    const before = await e2eApi.callApi<{ displayName: string }>({ request, session, method: 'GET', path });

    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path }), 'The viewer cannot read its own project').toBe(200);
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'POST', path, data: { displayName: e2eApi.uniqueName('renamed') } })).toBe(403);
    const pieceSet = await pieceSets.readForProject({ projectId: secondProject.id, session: viewer.session });
    expect(await e2eApi.callApiStatus({
      request,
      session: viewer.session,
      method: 'POST',
      path: `/api/v1/piece-sets/${pieceSet.id}/projects`,
      data: { projectIds: [secondProject.id] },
    })).toBe(403);

    const after = await e2eApi.callApi<{ displayName: string }>({ request, session, method: 'GET', path });
    expect(after.displayName).toBe(before.displayName);
  });
});

const HTTP = { name: '@activepieces/piece-http', displayName: 'HTTP' };
const STORAGE = { name: '@activepieces/piece-store', displayName: 'Storage' };
