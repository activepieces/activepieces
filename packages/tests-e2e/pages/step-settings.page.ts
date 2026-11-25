import { expect } from '@playwright/test';
import { BuilderPage } from './builder.page';

export class StepSettingsPage extends BuilderPage {
  async mapFromDataSelector({ input, stepName, keys }: { input: string; stepName: string; keys: string[] }) {
    await this.stepInput(input).click();
    const paths = keys.map((_, index) => `${stepName}['output']${keys.slice(0, index + 1).map((key) => `['${key}']`).join('')}`);
    for (const path of paths.slice(0, -1)) {
      await this.dataSelectorNode(path).click();
      await expect(this.dataSelectorNode(path)).toHaveAttribute('aria-expanded', 'true');
    }
    await this.dataSelectorNode(paths[paths.length - 1]).click();
  }

  async insertFormula({ input, functionName }: { input: string; functionName: string }) {
    await this.stepInput(input).click();
    await this.page.keyboard.type(`/${functionName}`);
    await this.page.getByRole('option', { name: new RegExp(`^${functionName}\\b`) }).click();
  }

  async typeInFocusedInput(text: string) {
    await this.page.keyboard.insertText(text);
  }

  async expectFormulaPreview(result: string) {
    await expect(this.page.getByTestId('formula-preview')).toHaveText(result);
  }

  async expectFormulaError(message: string) {
    await expect(this.page.getByTestId('formula-error')).toContainText(message);
  }

  async expectTestedSuccessfully() {
    await expect(this.sidebar().getByText('Tested Successfully')).toBeVisible();
  }

  private stepInput(name: string) {
    return this.sidebar().getByRole('textbox', { name, exact: true });
  }

  private dataSelectorNode(propertyPath: string) {
    return this.page.locator(`[data-testid="data-selector-node"][data-property-path="${propertyPath}"]`);
  }
}
