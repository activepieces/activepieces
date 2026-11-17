import { faker } from '@faker-js/faker';
import { test } from '../../../fixtures';
import { e2eFlows } from '../../../fixtures/flows';

test.describe('LiteLLM AI provider', () => {
  test.skip(process.env.AP_EDITION === 'ee', 'AI Center is locked on the unlicensed EE plan');

  test('admin connects a LiteLLM key and its models appear', async ({ aiProvidersPage, aiProviderCleanup }) => {
    const modelId = `e2e-${faker.string.alphanumeric({ length: 8, casing: 'lower' })}`;

    await aiProvidersPage.visit();
    const { providerId } = await aiProvidersPage.connectLiteLlm({
      name: e2eFlows.uniqueName('litellm'),
      baseUrl: 'https://litellm.invalid/v1',
      apiKey: faker.string.alphanumeric({ length: 24 }),
      models: modelId,
    });
    aiProviderCleanup.track(providerId);

    await aiProvidersPage.expectModelListed(modelId);
    await aiProvidersPage.page.reload();
    await aiProvidersPage.expectModelListed(modelId);
  });
});
