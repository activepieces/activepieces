import { expect, Locator } from '@playwright/test';
import { ProjectsPage } from './projects.page';

export class ProjectSettingsPage extends ProjectsPage {
  async openSettings(): Promise<void> {
    await this.page.getByTestId('project-settings-button').click();
  }

  async openTab(tab: 'general' | 'pieces'): Promise<void> {
    await this.page.getByTestId(`project-settings-tab-${tab}`).click();
  }

  nameInput(): Locator {
    return this.page.getByTestId('project-settings-name');
  }

  pieceSetBadge(): Locator {
    return this.page.getByTestId('project-settings-piece-set');
  }

  pieceRow(pieceName: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name: pieceName, exact: true }) });
  }

  async openFlow({ projectId, flowId }: { projectId: string; flowId: string }): Promise<void> {
    await this.page.goto(`/projects/${projectId}/flows/${flowId}`);
    await expect(this.page.getByTestId('rf__node-trigger')).toBeVisible();
  }

  async openStepPickerOfTriggerOnlyFlow(): Promise<void> {
    await this.page.getByRole('button', { name: 'Fit to view', exact: true }).click();
    await this.page.getByTestId('add-action-button').click();
  }

  async searchPieces(query: string): Promise<void> {
    await this.page.getByTestId('pieces-search-input').fill(query);
  }

  pieceCard(displayName: string): Locator {
    return this.page.getByTestId(displayName);
  }

  noPiecesFound(): Locator {
    return this.page.getByTestId('pieces-selector-no-results');
  }
}
