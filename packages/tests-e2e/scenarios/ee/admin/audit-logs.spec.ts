import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { test as auditLogTest } from '../../../fixtures/audit-logs';
import { test as listResponseTest } from '../../../fixtures/list-response';
import { AuditLogsPage } from '../../../pages/audit-logs.page';

const test = mergeTests(accessTest, auditLogTest, listResponseTest);

test.describe('Audit logs', { tag: ['@feature:audit', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('an action of the spec shows in the audit log', async ({ page, secondProject, auditLog }) => {
    const { names: [folderName] } = auditLog.folderNames({ count: 1 });
    await auditLog.createFolders({ names: [folderName], session: secondProject.session });
    const [event] = await auditLog.expectFolderEvents({ projectId: secondProject.id, names: [folderName] });
    const auditLogsPage = new AuditLogsPage(page);

    await auditLogsPage.expectLiveEvents();
    await auditLogsPage.filterBy({ filter: 'Action', option: 'Folder created' });
    await auditLogsPage.filterBy({ filter: 'Project', option: event.projectDisplayName });

    const row = auditLogsPage.folderCreatedRow(folderName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(event.userEmail);
    await expect(row).toContainText(event.projectDisplayName);
  });

  test('the audit events table filters by action and project and pages', async ({ page, secondProject, viewer, auditLog }) => {
    const { word, names } = auditLog.folderNames({ count: 11 });
    await auditLog.createFolders({ names, session: secondProject.session });
    const [event] = await auditLog.expectFolderEvents({ projectId: secondProject.id, names });
    const auditLogsPage = new AuditLogsPage(page);

    await auditLogsPage.expectLiveEvents();
    await auditLogsPage.filterBy({ filter: 'Action', option: 'Folder created' });
    await auditLogsPage.filterBy({ filter: 'Performed By', option: event.userEmail });
    await auditLogsPage.filterBy({ filter: 'Project', option: event.projectDisplayName });
    await auditLogsPage.filterByCreated('Last 7 Days');

    await expect(auditLogsPage.rowsMatching(word)).toHaveCount(10);
    const firstPage = await auditLogsPage.shownFolders({ word, names });
    await auditLogsPage.nextPage();
    await expect(auditLogsPage.rowsMatching(word)).toHaveCount(1);
    const secondPage = await auditLogsPage.shownFolders({ word, names });
    await auditLogsPage.previousPage();
    await expect(auditLogsPage.rowsMatching(word)).toHaveCount(10);

    expect(await auditLogsPage.shownFolders({ word, names })).toEqual(firstPage);
    expect(secondPage).toHaveLength(1);
    expect(new Set([...firstPage, ...secondPage]).size).toBe(names.length);

    const ownFolders = { action: 'folder.created', projectId: secondProject.id };
    await auditLogsPage.visitFiltered({ ...ownFolders, createdAfter: daysAgo(1) });
    await expect(auditLogsPage.rowsMatching(word)).toHaveCount(10);
    await auditLogsPage.visitFiltered({ ...ownFolders, userId: viewer.userId });
    await expect(auditLogsPage.emptyState(), 'Performed By still shows the events of another user').toBeVisible();
    await auditLogsPage.visitFiltered({ ...ownFolders, createdAfter: daysAgo(8), createdBefore: daysAgo(1) });
    await expect(auditLogsPage.emptyState(), 'Created still shows the events of today').toBeVisible();
  });

  test('an audit events filter with no match shows the empty state', async ({ page, secondProject, auditLog }) => {
    const projectName = await auditLog.readProjectName({ projectId: secondProject.id });
    const auditLogsPage = new AuditLogsPage(page);

    await auditLogsPage.expectLiveEvents();
    await auditLogsPage.filterBy({ filter: 'Action', option: 'Folder created' });
    await auditLogsPage.filterBy({ filter: 'Project', option: projectName });

    await expect(auditLogsPage.emptyState()).toBeVisible();
  });

  test('a failed audit events request shows the error state', async ({ page, listResponse }) => {
    const restore = await listResponse.fail({ resource: 'audit-events' });
    const auditLogsPage = new AuditLogsPage(page);

    await auditLogsPage.visit();

    await expect(auditLogsPage.errorState()).toBeVisible({ timeout: listResponse.ERROR_STATE_TIMEOUT_MS });
    await restore();
    await auditLogsPage.expectRetrySucceeds();
  });

  test('a user who is not a platform admin cannot read the audit log: the server refuses', async ({ session, viewer, auditLog }) => {
    const ownFlows = { path: '/api/v1/flows', params: { projectId: viewer.session.projectId, limit: '1' } };
    const auditEvents = { path: '/api/v1/audit-events', params: { limit: '1' } };

    expect(await auditLog.readStatus({ session: viewer.session, ...ownFlows }), 'The viewer cannot read the flows of its own project').toBe(200);
    expect(await auditLog.readStatus({ session: viewer.session, ...auditEvents })).toBe(403);
    expect(await auditLog.readStatus({ session, ...auditEvents })).toBe(200);
  });
});

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}
