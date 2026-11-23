import { randomInt } from 'node:crypto';
import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { e2eApi } from '../../../fixtures/api';
import { test as platformPiecesTest } from '../../../fixtures/platform-pieces';
import { test as projectSettingsTest } from '../../../fixtures/project-settings';
import formSubmit from '../../../fixtures/templates/form-submit.json';
import privateEcho from '../../../fixtures/templates/private-echo.json';
import { BuilderPage } from '../../../pages/builder.page';
import { PlatformPiecesPage } from '../../../pages/platform-pieces.page';
import { ProjectSettingsPage } from '../../../pages/project-settings.page';

const test = mergeTests(accessTest, projectSettingsTest, platformPiecesTest);

test.describe('Pieces and piece sets', { tag: ['@feature:pieces', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('hide a piece and the builder does not show it', { tag: '@platform-state' }, async ({ page, session, seed, pieceSets, defaultPieceSet }) => {
    const { flowId } = await seed.flow({ template: formSubmit, publish: false });
    expect(await pieceSets.pieceNames({ session }), 'The default project must see the piece before the test hides it').toContain(APPROVAL.name);
    const piecesPage = new PlatformPiecesPage(page);

    await piecesPage.openPieceSet({ id: defaultPieceSet.id, displayName: APPROVAL.search });
    await expect(piecesPage.pieceToggle(APPROVAL.name)).toBeChecked();
    await piecesPage.togglePiece(APPROVAL.name);
    await expect(piecesPage.pieceToggle(APPROVAL.name)).not.toBeChecked();

    const builder = new ProjectSettingsPage(page);
    await builder.openFlow({ projectId: session.projectId, flowId });
    await builder.openStepPickerOfTriggerOnlyFlow();
    await builder.searchPieces(HTTP.displayName);
    await expect(builder.pieceCard(HTTP.displayName)).toBeVisible();
    await builder.searchPieces(APPROVAL.search);
    await expect(builder.noPiecesFound()).toBeVisible();
    await expect(builder.pieceCard(APPROVAL.displayName)).toHaveCount(0);

    expect(await pieceSets.pieceNames({ session })).not.toContain(APPROVAL.name);
  });

  test('install a private piece and use it in a flow', { tag: '@platform-state' }, async ({ page, privatePiece }) => {
    const piecesPage = new PlatformPiecesPage(page);
    await piecesPage.open({ search: privatePiece.displayName });

    await piecesPage.installArchive(privatePiece.archive);
    const installed = await privatePiece.trackInstalled();
    expect(installed).toMatchObject({ name: privatePiece.name, version: privatePiece.version, pieceType: 'CUSTOM', packageType: 'ARCHIVE' });
    await expect(piecesPage.pieceRow(privatePiece.name)).toBeVisible();

    const { webhookUrl } = await privatePiece.seedFlow({ template: privateEcho });
    const value = randomInt(1, 1_000_000);
    await new BuilderPage(page).expectSyncWebhookResponse({
      url: `${webhookUrl}/sync?value=${value}`,
      expected: { message: 'custom-piece-works', value: String(value) },
    });
  });

  test('give a piece set to a project and the project sees only its pieces', async ({ page, request, session, cleanup, secondProject, pieceSets }) => {
    const project = await e2eApi.callApi<{ displayName: string }>({ request, session, method: 'GET', path: `/api/v1/projects/${secondProject.id}` });
    const piecesPage = new PlatformPiecesPage(page);
    await piecesPage.openPieceSets();
    const pieceSet = await piecesPage.createPieceSet(e2eApi.uniqueName('piece set'));
    cleanup.track({ resource: 'piece-sets', id: pieceSet.id });

    await piecesPage.openPieceSet({ id: pieceSet.id });
    await piecesPage.toggleIncludeNewPieces();
    await expect(piecesPage.includeNewPiecesToggle()).not.toBeChecked();
    await piecesPage.excludeAllPieces();

    await piecesPage.openPieceSet({ id: pieceSet.id, displayName: WEBHOOK.displayName });
    await expect(piecesPage.pieceToggle(WEBHOOK.name)).not.toBeChecked();
    const saved = await piecesPage.togglePiece(WEBHOOK.name);
    expect(saved.config.pieces).toEqual({ mode: 'exclude_all', exceptions: [WEBHOOK.name] });
    await piecesPage.assignProject(project.displayName);

    const applied = await pieceSets.readForProject({ projectId: secondProject.id });
    expect(applied.id).toBe(pieceSet.id);
    expect(await pieceSets.pieceNames({ session: secondProject.session })).toEqual([WEBHOOK.name]);
    expect(await pieceSets.pieceNames({ session }), 'The piece set reached the default project').toContain(HTTP.name);
  });

  test('a user who is not a platform admin cannot hide a piece: the server refuses', async ({ request, secondProject, viewer, pieceSets }) => {
    const pieceSet = await pieceSets.hidePiece({ projectId: secondProject.id, pieceName: STORAGE.name });
    const seen = await pieceSets.readForProject({ projectId: secondProject.id, session: viewer.session });
    expect(seen.id, 'The viewer cannot read the piece set of its own project').toBe(pieceSet.id);

    expect(await e2eApi.callApiStatus({
      request,
      session: viewer.session,
      method: 'POST',
      path: `/api/v1/piece-sets/${pieceSet.id}`,
      data: { pieces: { mode: 'include_all', exceptions: [STORAGE.name, HTTP.name] } },
    })).toBe(403);

    const after = await pieceSets.readForProject({ projectId: secondProject.id });
    expect(after.config.pieces.exceptions).toEqual([STORAGE.name]);
  });
});

const APPROVAL = { name: '@activepieces/piece-approval', displayName: 'Approval (Legacy)', search: 'Approval' };
const HTTP = { name: '@activepieces/piece-http', displayName: 'HTTP' };
const STORAGE = { name: '@activepieces/piece-store', displayName: 'Storage' };
const WEBHOOK = { name: '@activepieces/piece-webhook', displayName: 'Webhook' };
