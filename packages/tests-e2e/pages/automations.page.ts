import { readFile } from 'node:fs/promises';
import { expect, Response } from '@playwright/test';
import { BasePage } from './base';

export class AutomationsPage extends BasePage {
  url = `/automations`;

  async createFlow(): Promise<string> {
    await this.visit();
    const startFromScratch = this.page.getByRole('button', { name: 'Start from scratch' }).first();
    const createNew = this.page.getByRole('button', { name: 'Create New' });
    await startFromScratch.or(createNew).first().waitFor();
    await this.page.getByTestId('automations-loading').waitFor({ state: 'detached' });

    if (await startFromScratch.isVisible()) {
      await startFromScratch.click();
    } else {
      await createNew.click();
      await this.page.getByRole('menuitem', { name: 'New Flow' }).click();
    }

    await this.page.waitForURL(FLOW_URL);
    const flowId = FLOW_URL.exec(this.page.url())?.[1];
    if (!flowId) {
      throw new Error(`No flow id in ${this.page.url()}`);
    }
    return flowId;
  }

  async visitFlows(): Promise<void> {
    await this.page.goto(`${this.url}?type=flow`);
  }

  async searchFlows(term: string): Promise<void> {
    await this.page.goto(`${this.url}?type=flow&search=${encodeURIComponent(term)}`);
  }

  async typeSearch(term: string): Promise<void> {
    await this.searchInput().fill(term);
    await this.page.waitForURL((url) => url.searchParams.get('search') === term);
  }

  async filterByStatus(label: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Status', exact: true }).click();
    await this.page.getByRole('checkbox', { name: label, exact: true }).click();
    await this.page.keyboard.press('Escape');
    await this.page.waitForURL((url) => url.searchParams.has('status'));
  }

  async nextPage(): Promise<void> {
    await this.page.getByTestId('automations-next-page').click();
  }

  searchInput() {
    return this.page.getByTestId('automations-search-input');
  }

  row(name: string) {
    return this.page.getByTestId('automations-row-name').filter({ hasText: exactText(name) });
  }

  rowsMatching(prefix: string) {
    return this.page.getByTestId('automations-row-name').filter({ hasText: prefix });
  }

  noResults() {
    return this.page.getByTestId('automations-no-results');
  }

  importError() {
    return this.page.getByTestId('import-flow-error');
  }

  async renameFlow({ from, to }: { from: string; to: string }): Promise<void> {
    await this.openRowMenu(from);
    await this.page.getByRole('menuitem', { name: 'Rename' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Rename' });
    await dialog.getByRole('textbox').fill(to);
    await dialog.getByRole('button', { name: 'Rename' }).click();
    await expect(dialog).toBeHidden();
  }

  async duplicateFlow(name: string): Promise<string> {
    await this.openRowMenu(name);
    const created = this.page.waitForResponse(isFlowCreate);
    await this.page.getByRole('menuitem', { name: 'Duplicate' }).click();
    return createdFlowId(created);
  }

  async exportFlow(name: string): Promise<ExportedFlow> {
    await this.openRowMenu(name);
    const downloaded = this.page.waitForEvent('download');
    await this.page.getByRole('menuitem', { name: 'Export' }).click();
    const download = await downloaded;
    const buffer = await readFile(await download.path());
    const template: FlowTemplateFile = JSON.parse(buffer.toString('utf-8').replace(/^\uFEFF/, ''));
    return { file: { name: download.suggestedFilename(), mimeType: 'application/json', buffer }, template };
  }

  async importFlow(file: FlowFile): Promise<string> {
    const created = this.page.waitForResponse(isFlowCreate);
    await this.submitImport(file);
    const flowId = await createdFlowId(created);
    await this.page.waitForURL(new RegExp(`/flows/${flowId}`));
    return flowId;
  }

  async submitImport(file: FlowFile): Promise<void> {
    await this.page.getByRole('button', { name: 'Import', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Import Flow' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Import Flow' });
    await dialog.getByTestId('import-flow-file-input').setInputFiles(file);
    await dialog.getByRole('button', { name: 'Import', exact: true }).click();
  }

  async deleteFlow(name: string): Promise<void> {
    await this.openRowMenu(name);
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Delete flow' });
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async selectFlows(names: string[]): Promise<void> {
    for (const name of names) {
      await this.rowContainer(name).getByRole('checkbox').click();
    }
  }

  async moveSelectedTo(folderName: string): Promise<void> {
    await this.selectionBar().getByRole('button', { name: 'Move to', exact: true }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Move to Folder' });
    await dialog.getByRole('combobox').click();
    await this.page.getByRole('option', { name: folderName, exact: true }).click();
    await dialog.getByRole('button', { name: 'Move', exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async deleteSelected(): Promise<void> {
    await this.selectionBar().getByRole('button', { name: 'Delete', exact: true }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Delete Selected Items' });
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  private rowContainer(name: string) {
    return this.page.getByTestId('automations-row').filter({ has: this.row(name) });
  }

  private async openRowMenu(name: string): Promise<void> {
    await this.rowContainer(name).getByRole('button', { name: 'Actions' }).click();
  }

  private selectionBar() {
    return this.page.getByTestId('automations-selection-bar');
  }
}

function exactText(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

function isFlowCreate(response: Response): boolean {
  return response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/flows';
}

async function createdFlowId(created: Promise<Response>): Promise<string> {
  const response = await created;
  expect(response.ok(), `Creating the flow failed with ${response.status()}: ${await response.text()}`).toBe(true);
  const flow: { id: string } = await response.json();
  return flow.id;
}

const FLOW_URL = /\/flows\/([^/?#]+)/;

export type FlowFile = { name: string; mimeType: string; buffer: Buffer };
export type FlowTemplateFile = { name: string; flows: { displayName: string }[] };
export type ExportedFlow = { file: FlowFile; template: FlowTemplateFile };
