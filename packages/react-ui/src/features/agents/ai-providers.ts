import { t } from 'i18next';

import { AIProviderName } from '@activepieces/shared';

export const SUPPORTED_AI_PROVIDERS: AiProviderInfo[] = [
  {
    provider: AIProviderName.OPENAI,
    name: 'OpenAI',
    markdown: t(`Follow these instructions to get your OpenAI API Key:

1. Go to https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`),
    logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  },
  {
    provider: AIProviderName.ANTHROPIC,
    name: 'Anthropic',
    markdown: t(`Follow these instructions to get your Claude API Key:

1. Go to https://console.anthropic.com/settings/keys.
2. Once on the website, locate and click on the option to obtain your Claude API Key.
`),
    logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
  },
  {
    provider: AIProviderName.GOOGLE,
    name: 'Google Gemini',
    markdown: t(`Follow these instructions to get your Google API Key:
1. Go to https://console.cloud.google.com/apis/credentials.
2. Once on the website, locate and click on the option to obtain your Google API Key.
`),
    logoUrl: 'https://cdn.activepieces.com/pieces/google-gemini.png',
  },
  {
    provider: AIProviderName.AZURE,
    name: 'Azure',
    logoUrl: 'https://cdn.activepieces.com/pieces/azure-openai.png',
    markdown: t(
      'Use the Azure Portal to browse to your OpenAI resource and retrieve an API key and resource name.',
    ),
  },
  {
    provider: AIProviderName.OPENROUTER,
    name: 'OpenRouter',
    logoUrl: 'https://cdn.activepieces.com/pieces/openrouter.jpg',
    markdown: t(`Follow these instructions to get your OpenRouter API Key:
1. Go to https://openrouter.ai/settings/keys.
2. Once on the website, locate and click on the option to obtain your OpenRouter API Key.`),
  },
  {
    provider: AIProviderName.CLOUDFLARE_GATEWAY,
    name: 'Cloudflare AI Gateway',
    logoUrl: 'https://cdn.activepieces.com/pieces/cloudflare-gateway.png',
    markdown:
      t(`Follow these instructions to get your Cloudflare AI Gateway API Key:
1. Go to https://developers.cloudflare.com/ai-gateway/get-started/ to create your gateway then enter it from the dashboard.
2. Look in the overview section for this link https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_name}/ to get your account id and gateway id.
3. Create an AI Gateway Token by checking https://developers.cloudflare.com/ai-gateway/configuration/authentication/#setting-up-authenticated-gateway-using-the-dashboard.
4. In your gateway dashboard, go to the providers tab and add your API keys for each provider.
5. After you finish all the previous steps and filled the required inputs, add models but make sure you prefix the model id with the provider name i.e (openai/gpt-4o) or (anthropic/claude-3-5-sonnet), check https://developers.cloudflare.com/ai-gateway/usage/chat-completion/ for more information.`),
  },
  {
    provider: AIProviderName.CUSTOM,
    name: 'OpenAI Compatible',
    logoUrl: 'https://cdn.activepieces.com/pieces/openai-compatible.png',
    markdown:
      t(`Follow these instructions to get your OpenAI Compatible API Key:
1. Set the base url to your proxy url.
2. In the api key header, set the value of your auth header name.
3. In the api key, set your auth header value (full value including the Bearer if any).`),
  },
];

export type AiProviderInfo = {
  provider: AIProviderName;
  name: string;
  markdown: string;
  logoUrl: string;
};
