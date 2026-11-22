import { expect, Locator, Request, Response } from '@playwright/test';
import { AutomationsPage, FlowFile } from './automations.page';
import { BasePage } from './base';

export class PlatformTemplatesPage extends BasePage {
  url = '/platform/templates';

  async createTemplate({ name, file, onCreated }: { name: string; file: FlowFile; onCreated: (templateId: string) => void }): Promise<string> {
    const created = this.page.waitForResponse((response) => isTemplateCreate(response.request()));
    await this.submitTemplate({ name, file });
    const templateId = await createdId(created);
    onCreated(templateId);
    await expect(this.createDialog()).toBeHidden();
    return templateId;
  }

  async openCreateDialog(): Promise<void> {
    await this.page.getByRole('button', { name: 'New Template', exact: true }).click();
    await expect(this.createDialog()).toBeVisible();
  }

  async submitTemplate({ name, file }: { name: string; file: FlowFile }): Promise<void> {
    await this.createDialog().getByTestId('create-template-file-input').setInputFiles(file);
    await this.createDialog().getByTestId('create-template-name-input').fill(name);
    await this.createDialog().getByRole('button', { name: 'Save', exact: true }).click();
  }

  countTemplateCreates(): () => number {
    const creates: Request[] = [];
    this.page.on('request', (request) => {
      if (isTemplateCreate(request)) {
        creates.push(request);
      }
    });
    return () => creates.length;
  }

  async useTemplateInProject({ name, onCreated }: { name: string; onCreated: (flowId: string) => void }): Promise<string> {
    await new AutomationsPage(this.page).searchFlows(name);
    await this.page.getByRole('button', { name: 'Create New', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Start from Template' }).click();
    await this.page.waitForURL((url) => url.pathname === '/templates');
    await this.page.getByTestId('templates-search-input').fill(name);
    await this.page.getByRole('heading', { name, exact: true }).click();
    await this.page.getByRole('button', { name: 'Use Template', exact: true }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Use Template' });
    const created = this.page.waitForResponse(isFlowCreate);
    await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
    const flowId = await createdId(created);
    onCreated(flowId);
    await this.page.waitForURL(new RegExp(`/flows/${flowId}`));
    return flowId;
  }

  createDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Create New Template' });
  }

  nameError(): Locator {
    return this.createDialog().getByTestId('create-template-name-error');
  }

  row(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(name, { exact: true }) });
  }
}

function isTemplateCreate(request: Request): boolean {
  return request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/templates';
}

function isFlowCreate(response: Response): boolean {
  return response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/flows';
}

async function createdId(created: Promise<Response>): Promise<string> {
  const response = await created;
  expect(response.ok(), `POST ${new URL(response.url()).pathname} failed with ${response.status()}: ${await response.text()}`).toBe(true);
  const body: { id: string } = await response.json();
  return body.id;
}
