import { CopilotProviderType } from '@activepieces/shared';
import { CopilotProviderMetadata } from './copilot-provider-card';

export const COPILOT_PROVIDERS: CopilotProviderMetadata[] = [
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
    label: 'OpenAI',
    value: 'openai',
    type: CopilotProviderType.ASSISTANT,
    instructionsMarkdown: `
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the API key and paste it here
    `,
  },
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/azure-openai.png',
    label: 'Azure OpenAI',
    value: 'azure',
    type: CopilotProviderType.ASSISTANT,
    requiresBaseUrl: true,
    requiresDeploymentName: true,
    instructionsMarkdown: `
1. Go to your Azure OpenAI resource
2. Get your API key and endpoint
3. Enter your deployment name
4. Copy the API key and paste it here
    `,
  },
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
    label: 'Anthropic',
    value: 'anthropic',
    type: CopilotProviderType.ASSISTANT,
    instructionsMarkdown: `
1. Go to [Anthropic API Keys](https://console.anthropic.com/account/keys)
2. Click "Create key"
3. Copy the API key and paste it here
    `,
  },
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/perplexity-ai.png',
    label: 'Perplexity',
    value: 'perplexity',
    type: CopilotProviderType.SEARCH,
    instructionsMarkdown: `
1. Go to [Perplexity API Keys](https://www.perplexity.ai/settings/api)
2. Click "Create new API key"
3. Copy the API key and paste it here
    `,
  },
]; 