import { expect, Locator, Request, Response } from '@playwright/test';
import { BasePage } from './base';

export class ProjectsPage extends BasePage {
  url = '/platform/projects';

  async visitProject(projectId: string): Promise<void> {
    await this.page.goto(`/projects/${projectId}/automations`);
    await expect(this.railProjects()).toBeVisible();
  }

  railProjects(): Locator {
    return this.page.getByTestId('rail-projects');
  }

  railProject(displayName: string): Locator {
    return this.railProjects().getByRole('button', { name: displayName });
  }

  createProjectButton(): Locator {
    return this.page.getByTestId('create-project-button');
  }

  async createFromRail(displayName: string): Promise<string> {
    await this.createProjectButton().click();
    await this.page.getByTestId('new-project-name').fill(displayName);
    const created = this.page.waitForResponse(isProjectCreate);
    await this.page.getByTestId('new-project-submit').click();
    const response = await created;
    expect(response.status(), 'The server did not create the project').toBe(201);
    const project: { id: string } = await response.json();
    return project.id;
  }

  async submitEmptyName(): Promise<() => number> {
    const sent: Request[] = [];
    this.page.on('request', (request) => sent.push(request));
    await this.createProjectButton().click();
    await this.page.getByTestId('new-project-name').fill('');
    await this.page.getByTestId('new-project-submit').click();
    return () => sent.filter((request) => request.method() === 'POST' && isProjectsPath(request.url())).length;
  }

  newProjectNameError(): Locator {
    return this.page.getByTestId('new-project-name-error');
  }

  newProjectNameInput(): Locator {
    return this.page.getByTestId('new-project-name');
  }

  async renameCurrentProject({ projectId, displayName }: { projectId: string; displayName: string }): Promise<void> {
    await this.page.getByTestId('project-settings-button').click();
    await this.page.getByTestId('project-settings-name').fill(displayName);
    const saved = this.page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === `/api/v1/projects/${projectId}`);
    await this.page.getByTestId('project-settings-save').click();
    expect((await saved).status(), 'The server did not save the new name').toBe(200);
  }

  async searchByName(text: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Name', exact: true }).click();
    await this.page.getByPlaceholder('Search', { exact: true }).fill(text);
    await expect(this.page).toHaveURL((url) => url.searchParams.get('displayName') === text);
    await this.page.keyboard.press('Escape');
  }

  rows(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  async shownNames({ word, names }: { word: string; names: string[] }): Promise<string[]> {
    const texts = await this.rows(word).allInnerTexts();
    return names.filter((name) => texts.some((text) => text.includes(name)));
  }

  async nextPage(): Promise<void> {
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
  }

  async previousPage(): Promise<void> {
    await this.page.getByRole('button', { name: 'Previous', exact: true }).click();
  }

  async openRow(displayName: string): Promise<void> {
    await this.rows(displayName).getByRole('cell', { name: displayName }).click();
  }

  async deleteRow({ projectId, displayName }: { projectId: string; displayName: string }): Promise<void> {
    await this.rows(displayName).getByRole('checkbox').click();
    await this.page.getByRole('button', { name: 'Delete (1)', exact: true }).click();
    const deleted = this.page.waitForResponse((response) => response.request().method() === 'DELETE' && new URL(response.url()).pathname === `/api/v1/projects/${projectId}`);
    await this.page.getByRole('dialog').getByRole('button', { name: 'Delete 1 project', exact: true }).click();
    expect((await deleted).status(), 'The server did not delete the project').toBe(204);
  }

  emptyState(): Locator {
    return this.page.getByTestId('data-table-empty-state');
  }

  async visitFiltered({ displayName, type }: { displayName: string; type: 'TEAM' | 'PERSONAL' }): Promise<void> {
    await this.page.goto(`${this.url}?${new URLSearchParams({ displayName, type })}`);
  }
}

function isProjectCreate(response: Response): boolean {
  return response.request().method() === 'POST' && isProjectsPath(response.url());
}

function isProjectsPath(url: string): boolean {
  return new URL(url).pathname === '/api/v1/projects';
}
