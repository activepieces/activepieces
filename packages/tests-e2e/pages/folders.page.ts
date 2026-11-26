import { expect, Request, Response } from '@playwright/test';
import { AutomationsPage } from './automations.page';

export class FoldersPage extends AutomationsPage {
  async createFolder(name: string): Promise<string> {
    await this.openCreateFolderDialog();
    return this.confirmFolderName(name);
  }

  async openCreateFolderDialog(): Promise<void> {
    await this.page.getByRole('button', { name: 'Create New' }).click();
    await this.page.getByRole('menuitem', { name: 'New Folder' }).click();
    await expect(this.createFolderDialog()).toBeVisible();
  }

  async submitFolderName(name: string): Promise<void> {
    await this.folderNameInput().fill(name);
    await this.createFolderDialog().getByRole('button', { name: 'Create', exact: true }).click();
  }

  async confirmFolderName(name: string): Promise<string> {
    const created = this.page.waitForResponse((response) => isFolderCreate(response.request()));
    await this.submitFolderName(name);
    const folderId = await createdFolderId(created);
    await expect(this.createFolderDialog()).toBeHidden();
    return folderId;
  }

  async expectFolderNameMissing(): Promise<void> {
    expect(await this.folderNameInput().evaluate((input) => input instanceof HTMLInputElement && input.validity.valueMissing)).toBe(true);
  }

  countFolderCreates(): () => number {
    const creates: Request[] = [];
    this.page.on('request', (request) => {
      if (isFolderCreate(request)) {
        creates.push(request);
      }
    });
    return () => creates.length;
  }

  createFolderDialog() {
    return this.page.getByRole('dialog', { name: 'Create Folder' });
  }

  folderNameInput() {
    return this.createFolderDialog().getByRole('textbox');
  }

  folderNameError() {
    return this.createFolderDialog().getByTestId('create-folder-name-error');
  }

  async moveFlowTo({ flowName, folderName }: { flowName: string; folderName: string }): Promise<void> {
    await this.openRowMenu(flowName);
    await this.page.getByRole('menuitem', { name: 'Move To' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Move to Folder' });
    await dialog.getByRole('combobox').click();
    await this.page.getByRole('option', { name: folderName, exact: true }).click();
    await dialog.getByRole('button', { name: 'Move', exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async renameFolder({ from, to }: { from: string; to: string }): Promise<void> {
    await this.renameFlow({ from, to });
  }

  async deleteFolder(name: string): Promise<void> {
    await this.openRowMenu(name);
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Delete folder' });
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog).toBeHidden();
  }
}

function isFolderCreate(request: Request): boolean {
  return request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/folders';
}

async function createdFolderId(created: Promise<Response>): Promise<string> {
  const response = await created;
  expect(response.ok(), `Creating the folder failed with ${response.status()}: ${await response.text()}`).toBe(true);
  const folder: { id: string } = await response.json();
  return folder.id;
}
