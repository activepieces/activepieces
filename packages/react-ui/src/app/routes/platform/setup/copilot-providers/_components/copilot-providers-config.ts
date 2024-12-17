import { CopilotProviderType } from '@activepieces/shared';
import { CopilotProviderMetadata } from './copilot-provider-card';

export const COPILOT_PROVIDERS: CopilotProviderMetadata[] = [
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
    label: 'OpenAI',
    value: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    type: CopilotProviderType.ASSISTANT,
    instructionsMarkdown: `
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the API key and paste it here
    `,
  },
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
    label: 'Anthropic',
    value: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
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
    defaultBaseUrl: 'https://api.perplexity.ai',
    type: CopilotProviderType.SEARCH,
    instructionsMarkdown: `
1. Go to [Perplexity API Keys](https://www.perplexity.ai/settings/api)
2. Click "Create new API key"
3. Copy the API key and paste it here
    `,
  },
]; 