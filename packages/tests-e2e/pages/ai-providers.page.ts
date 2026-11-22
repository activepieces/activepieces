import { expect } from '@playwright/test';
import { BasePage } from './base';

export class AiProvidersPage extends BasePage {
  url = `/platform/ai`;

  async connectLiteLlm({ name, baseUrl, apiKey, models }: { name: string; baseUrl: string; apiKey: string; models: string }): Promise<{ providerId: string }> {
    await this.page.getByTestId('ai-provider-add-key').click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: 'Provider' }).click();
    await this.page.getByRole('option', { name: 'LiteLLM' }).click();
    await dialog.getByTestId('ai-provider-name').fill(name);
    await dialog.getByTestId('ai-provider-field-baseUrl').fill(baseUrl);
    await dialog.getByTestId('ai-provider-field-apiKey').fill(apiKey);
    await dialog.getByTestId('ai-provider-advanced-toggle').click();
    await expect(dialog.getByTestId('ai-provider-field-apiKeyHeader')).toHaveValue('Authorization');
    await dialog.getByTestId('ai-provider-field-typedModels').fill(models);
    const created = this.page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/ai-providers');
    await dialog.getByTestId('ai-provider-connect-submit').click();
    const response = await created;
    expect(response.ok(), await response.text()).toBe(true);
    const provider: { id: string } = await response.json();
    return { providerId: provider.id };
  }

  async expectModelListed(modelId: string) {
    await expect(this.page.getByTestId('ai-provider-model-list')).toContainText(modelId);
  }
}
