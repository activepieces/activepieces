import { expect, Locator, Response } from '@playwright/test';
import { BasePage } from './base';

export class AuditLogsPage extends BasePage {
  url = '/platform/audit-log';

  async expectLiveEvents(): Promise<void> {
    const listed = this.page.waitForResponse(isAuditEventsList, { timeout: LIVE_LIST_TIMEOUT_MS }).catch(() => {
      throw new Error(`The page sent no audit events request in ${LIVE_LIST_TIMEOUT_MS} ms: a plan without auditLogEnabled shows sample data`);
    });
    await this.visit();
    expect((await listed).status(), 'The audit events request failed').toBe(200);
  }

  async filterBy({ filter, option }: { filter: 'Action' | 'Performed By' | 'Project'; option: string }): Promise<void> {
    const trigger = this.page.getByRole('button', { name: new RegExp(`^${filter}`) });
    await trigger.click();
    await this.page.getByPlaceholder(filter, { exact: true }).fill(option);
    const listed = this.page.waitForResponse(isAuditEventsList);
    await this.page.getByRole('option', { name: option, exact: true }).click();
    await listed;
    await this.page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }

  async filterByCreated(preset: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Pick a date range' }).click();
    await this.page.getByRole('combobox').filter({ hasText: 'Select preset' }).click();
    const listed = this.page.waitForResponse(isAuditEventsList);
    await this.page.getByRole('option', { name: preset, exact: true }).click();
    await listed;
    await this.page.keyboard.press('Escape');
  }

  async nextPage(): Promise<void> {
    const listed = this.page.waitForResponse(isAuditEventsList);
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
    await listed;
  }

  async previousPage(): Promise<void> {
    const listed = this.page.waitForResponse(isAuditEventsList);
    await this.page.getByRole('button', { name: 'Previous', exact: true }).click();
    await listed;
  }

  async expectRetrySucceeds(): Promise<void> {
    const listed = this.page.waitForResponse(isAuditEventsList);
    await this.retryAfterError();
    expect((await listed).status()).toBe(200);
    await expect(this.errorState()).toBeHidden();
  }

  async shownFolders({ word, names }: { word: string; names: string[] }): Promise<string[]> {
    const texts = await this.rowsMatching(word).allInnerTexts();
    return names.filter((name) => texts.some((text) => text.includes(folderCreatedDetails(name))));
  }

  folderCreatedRow(name: string): Locator {
    return this.rowsMatching(folderCreatedDetails(name));
  }

  rowsMatching(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  emptyState(): Locator {
    return this.page.getByTestId('data-table-empty-state');
  }

  async visitFiltered(filters: Record<string, string>): Promise<void> {
    const listed = this.page.waitForResponse(isAuditEventsList);
    await this.page.goto(`${this.url}?${new URLSearchParams(filters)}`);
    expect((await listed).status(), 'The audit events request failed').toBe(200);
  }
}

function folderCreatedDetails(name: string): string {
  return `${name} is created`;
}

function isAuditEventsList(response: Response): boolean {
  const url = new URL(response.url());
  return response.request().method() === 'GET' && url.pathname === '/api/v1/audit-events' && url.searchParams.get('order') !== 'ASC';
}

const LIVE_LIST_TIMEOUT_MS = 15_000;
