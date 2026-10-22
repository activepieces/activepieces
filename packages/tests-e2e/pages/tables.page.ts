import { Locator } from '@playwright/test';
import { BasePage } from './base';

export class TablesPage extends BasePage {
  url = `/tables`;

  async openTable(params: { projectId: string; tableId: string }) {
    await this.page.goto(`/projects/${params.projectId}/tables/${params.tableId}`);
    await this.page.getByRole('grid').waitFor();
  }

  cell(params: { rowIdx: number; columnIdx: number }): Locator {
    return this.page.locator(`#editable-cell-${params.rowIdx}-${params.columnIdx}`);
  }
}
