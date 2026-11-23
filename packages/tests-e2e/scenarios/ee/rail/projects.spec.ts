import { randomUUID } from 'node:crypto';
import type { Browser } from '@playwright/test';
import { e2eApi, E2eSession } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/projects';
import { ProjectsPage } from '../../../pages/projects.page';

test.describe('Projects', { tag: ['@feature:projects', '@surface'] }, () => {
  test('create a project, switch to it and rename it', async ({ page, request, session, teamProjects }) => {
    const projectsPage = new ProjectsPage(page);
    const name = e2eApi.uniqueName('project');
    const newName = e2eApi.uniqueName('renamed');

    await projectsPage.visitProject(session.projectId);
    const projectId = await projectsPage.createFromRail(name);
    teamProjects.track({ id: projectId });
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/automations`));

    await projectsPage.visitProject(session.projectId);
    await projectsPage.railProject(name).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/automations`));
    await expect(projectsPage.railProject(name)).toHaveAttribute('aria-current', 'page');

    await projectsPage.renameCurrentProject({ projectId, displayName: newName });
    await page.reload();
    await expect(projectsPage.railProject(newName)).toHaveAttribute('aria-current', 'page');
    await expect(projectsPage.railProject(name)).toHaveCount(0);
    const saved = await e2eApi.callApi<{ displayName: string }>({ request, session, method: 'GET', path: `/api/v1/projects/${projectId}` });
    expect(saved.displayName).toBe(newName);
  });

  test('delete a project, and it stays deleted after reload', async ({ page, request, session, teamProjects }) => {
    const project = await teamProjects.create({ displayName: e2eApi.uniqueName('project') });
    const projectsPage = new ProjectsPage(page);

    await projectsPage.visit();
    await projectsPage.searchByName(project.displayName);
    await projectsPage.deleteRow({ projectId: project.id, displayName: project.displayName });
    await expect(projectsPage.rows(project.displayName)).toHaveCount(0);

    await page.reload();
    await expect(projectsPage.emptyState()).toBeVisible();
    const read = await request.get(`/api/v1/projects/${project.id}`, { headers: bearer(session) });
    expect(read.status()).toBe(404);
  });

  test('a project with an empty name shows an error', async ({ page, session }) => {
    const projectsPage = new ProjectsPage(page);

    await projectsPage.visitProject(session.projectId);
    const createRequests = await projectsPage.submitEmptyName();

    await expect(projectsPage.newProjectNameError()).toHaveText('Name is required');
    await expect(projectsPage.newProjectNameInput()).toBeVisible();
    expect(createRequests(), 'The dialog sent a create request for an empty name').toBe(0);
  });

  test('the projects table pages, filters and searches by the spec prefix', async ({ page, teamProjects }) => {
    const word = `E2E table ${randomUUID().slice(0, 8)}`;
    const names = Array.from({ length: 11 }, (_, index) => `${word} ${String(index).padStart(2, '0')}`);
    await Promise.all(names.map((displayName) => teamProjects.create({ displayName })));
    const projectsPage = new ProjectsPage(page);

    await projectsPage.visit();
    await expect(page, 'The Type filter starts on team projects').toHaveURL((url) => url.searchParams.getAll('type').join() === 'TEAM');
    await projectsPage.searchByName(word);
    await expect(projectsPage.rows(word)).toHaveCount(10);
    const firstPage = await projectsPage.shownNames({ word, names });

    await projectsPage.nextPage();
    await expect(projectsPage.rows(word)).toHaveCount(1);
    const secondPage = await projectsPage.shownNames({ word, names });

    await projectsPage.previousPage();
    await expect(projectsPage.rows(word)).toHaveCount(10);
    expect(await projectsPage.shownNames({ word, names })).toEqual(firstPage);
    expect([...firstPage, ...secondPage].sort()).toEqual(names);

    await projectsPage.visitFiltered({ displayName: word, type: 'PERSONAL' });
    await expect(projectsPage.emptyState(), 'The Personal filter still shows the team projects').toBeVisible();
    await expect(projectsPage.rows(word)).toHaveCount(0);
    await projectsPage.visitFiltered({ displayName: word, type: 'TEAM' });
    await expect(projectsPage.rows(word)).toHaveCount(10);
  });

  test('a projects filter with no match shows the empty state', async ({ page }) => {
    const projectsPage = new ProjectsPage(page);

    await projectsPage.visit();
    await projectsPage.searchByName(`E2E none ${randomUUID().slice(0, 8)}`);

    await expect(projectsPage.emptyState()).toBeVisible();
  });

  test('a row of the platform projects table opens that project', async ({ page, teamProjects }) => {
    const project = await teamProjects.create({ displayName: e2eApi.uniqueName('project') });
    const projectsPage = new ProjectsPage(page);

    await projectsPage.visit();
    await projectsPage.searchByName(project.displayName);
    await projectsPage.openRow(project.displayName);

    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}/automations`));
    await expect(projectsPage.railProject(project.displayName)).toHaveAttribute('aria-current', 'page');
  });

  test('a member cannot delete a project: the server refuses', async ({ browser, baseURL, request, session, secondProject, viewer }) => {
    const path = `/api/v1/projects/${secondProject.id}`;
    const viewerRead = await request.get(path, { headers: bearer(viewer.session) });
    expect(viewerRead.status(), 'The viewer is not a member of the second project').toBe(200);

    const viewerDelete = await request.delete(path, { headers: bearer(viewer.session) });
    expect(viewerDelete.status()).toBe(403);
    const adminRead = await request.get(path, { headers: bearer(session) });
    expect(adminRead.status(), 'The project is gone after the refused delete').toBe(200);

    const viewerPage = await openAs({ browser, baseURL, session: viewer.session });
    await viewerPage.visitProject(secondProject.id);
    await expect(viewerPage.createProjectButton()).toHaveCount(0);
    await viewerPage.page.context().close();
  });

  test('a member sees only the projects it belongs to', async ({ browser, baseURL, request, session, secondProject, viewer, teamProjects }) => {
    const outside = await teamProjects.create({ displayName: e2eApi.uniqueName('project') });
    const { displayName: memberProjectName } = await e2eApi.callApi<{ displayName: string }>({ request, session, method: 'GET', path: `/api/v1/projects/${secondProject.id}` });

    const outsiderRead = await request.get(`/api/v1/projects/${outside.id}`, { headers: bearer(viewer.session) });
    expect(outsiderRead.status()).toBe(403);
    const listed = await e2eApi.callApi<{ data: { id: string }[] }>({ request, session: viewer.session, method: 'GET', path: '/api/v1/projects', params: { limit: '100' } });
    const listedIds = listed.data.map((project) => project.id);
    expect(listedIds).toContain(secondProject.id);
    expect(listedIds).not.toContain(outside.id);
    expect(listedIds).not.toContain(session.projectId);

    const viewerPage = await openAs({ browser, baseURL, session: viewer.session });
    await viewerPage.visitProject(secondProject.id);
    await expect(viewerPage.railProject(memberProjectName)).toBeVisible();
    await expect(viewerPage.railProject(outside.displayName)).toHaveCount(0);
    await viewerPage.page.context().close();
  });
});

async function openAs({ browser, baseURL, session }: { browser: Browser; baseURL: string | undefined; session: E2eSession }): Promise<ProjectsPage> {
  const context = await browser.newContext({
    baseURL,
    storageState: {
      cookies: [],
      origins: [{ origin: new URL(baseURL ?? '').origin, localStorage: [{ name: 'token', value: session.token }, { name: 'projectId', value: session.projectId }] }],
    },
  });
  return new ProjectsPage(await context.newPage());
}

function bearer(session: E2eSession): Record<string, string> {
  return { Authorization: `Bearer ${session.token}` };
}
