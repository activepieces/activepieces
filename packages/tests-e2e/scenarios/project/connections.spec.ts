import { randomUUID } from 'node:crypto';
import { mergeTests } from '@playwright/test';
import { e2eApi } from '../../fixtures/api';
import { test as connectionsListTest } from '../../fixtures/connections-list';
import { expect, test as listResponseTest } from '../../fixtures/list-response';
import { ConnectionsPage } from '../../pages/connections.page';

const test = mergeTests(listResponseTest, connectionsListTest);

test.describe('Connections', { tag: ['@feature:connections', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('create a connection, rename it and delete it', async ({ page, cleanup, connectionsList }) => {
    const name = e2eApi.uniqueName('connection');
    const renamed = `${name} renamed`;
    const connectionsPage = new ConnectionsPage(page);
    await connectionsPage.visitWithName(name);

    const connectionId = await test.step('Create the connection', async () => {
      const id = await connectionsPage.createConnection({ pieceName: PIECE, name, fields: { 'API Key': `e2e-${randomUUID()}` } });
      cleanup.track({ resource: 'app-connections', id });
      await expect(connectionsPage.row(name)).toBeVisible();
      return id;
    });

    await test.step('Rename the connection', async () => {
      await connectionsPage.renameConnection({ from: name, to: renamed });
      await page.reload();
      await expect(connectionsPage.row(renamed)).toBeVisible();
      expect((await connectionsList.readConnection({ id: connectionId }))?.displayName).toBe(renamed);
    });

    await test.step('Delete the connection', async () => {
      await connectionsPage.selectConnections([renamed]);
      await connectionsPage.deleteSelected();
      await page.reload();
      await expect(connectionsPage.emptyState()).toBeVisible();
      expect(await connectionsList.readConnection({ id: connectionId })).toBeNull();
    });
  });

  test('a connection with an empty required field is not saved', async ({ page, connectionsList }) => {
    const name = e2eApi.uniqueName('connection');
    const connectionsPage = new ConnectionsPage(page);
    await connectionsPage.visitWithName(name);

    const dialog = await connectionsPage.openConnectDialog(PIECE);
    await connectionsPage.fillConnection({ dialog, name, fields: {} });
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(dialog.getByLabel('API Key')).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog).toBeVisible();
    expect(await connectionsList.findByName({ displayName: name })).toEqual([]);
  });

  test('delete the selected connections in bulk', async ({ page, connectionsList }) => {
    const prefix = connectionsList.newPrefix();
    const [first, second, kept] = await connectionsList.seedConnections({ prefix, count: 3 });
    const connectionsPage = new ConnectionsPage(page);
    await connectionsPage.visitWithName(prefix);

    await connectionsPage.selectConnections([first.displayName, second.displayName]);
    await connectionsPage.deleteSelected();

    await expect(connectionsPage.row(first.displayName)).toBeHidden();
    await expect(connectionsPage.row(second.displayName)).toBeHidden();
    await expect(connectionsPage.row(kept.displayName)).toBeVisible();
    expect(await connectionsList.readConnection({ id: first.id })).toBeNull();
    expect(await connectionsList.readConnection({ id: second.id })).toBeNull();
    expect(await connectionsList.readConnection({ id: kept.id })).not.toBeNull();
  });

  test('the connections table pages, filters and searches by the spec prefix', async ({ page, connectionsList }) => {
    const prefix = connectionsList.newPrefix();
    const [single] = await connectionsList.seedConnections({ prefix, count: PAGE_SIZE + 1 });
    const [unmatched] = await connectionsList.seedConnections({ prefix: connectionsList.newPrefix(), count: 1 });
    const connectionsPage = new ConnectionsPage(page);
    await connectionsPage.visit();

    await connectionsPage.filterByName(prefix);
    await expect(connectionsPage.rowsMatching(prefix)).toHaveCount(PAGE_SIZE);
    await expect(connectionsPage.row(unmatched.displayName)).toBeHidden();

    await connectionsPage.nextPage();
    await expect(connectionsPage.rowsMatching(prefix)).toHaveCount(1);

    await connectionsPage.filterByName(single.displayName);
    await expect(connectionsPage.rowsMatching(prefix)).toHaveCount(1);
    await expect(connectionsPage.row(single.displayName)).toBeVisible();

    await page.reload();
    await expect(connectionsPage.nameFilter()).toContainText(single.displayName);
    await expect(connectionsPage.rowsMatching(prefix)).toHaveCount(1);
    await expect(connectionsPage.row(single.displayName)).toBeVisible();
  });

  test('a connections filter with no match shows the empty state', async ({ page, connectionsList }) => {
    const [unmatched] = await connectionsList.seedConnections({ prefix: connectionsList.newPrefix(), count: 1 });
    const connectionsPage = new ConnectionsPage(page);

    await connectionsPage.visitWithName(e2eApi.uniqueName('no match'));

    await expect(connectionsPage.emptyState()).toContainText('No connections found');
    await expect(connectionsPage.row(unmatched.displayName)).toBeHidden();
  });

  test('a failed connections request shows the error state', async ({ page, connectionsList, listResponse }) => {
    const prefix = connectionsList.newPrefix();
    const [connection] = await connectionsList.seedConnections({ prefix, count: 1 });
    const restoreConnections = await listResponse.fail({ resource: 'app-connections' });
    const connectionsPage = new ConnectionsPage(page);

    await connectionsPage.visitWithName(prefix);
    await expect(connectionsPage.errorState()).toBeVisible({ timeout: listResponse.ERROR_STATE_TIMEOUT_MS });

    await restoreConnections();
    await connectionsPage.retryAfterError();
    await expect(connectionsPage.row(connection.displayName)).toBeVisible();
    await expect(connectionsPage.errorState()).toBeHidden();
  });
});

const PIECE = 'Activepieces Platform';
const PAGE_SIZE = 10;
