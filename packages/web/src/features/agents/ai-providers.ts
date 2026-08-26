import { AIProviderName } from '@activepieces/core-utils';
import { t } from 'i18next';

export const SUPPORTED_AI_PROVIDERS: AiProviderInfo[] = [
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
    provider: AIProviderName.BEDROCK,
    name: 'AWS Bedrock',
    logoUrl: 'https://cdn.activepieces.com/pieces/amazon-bedrock.png',
    markdown: t(`Connect your AWS account to use Amazon Bedrock AI models.

1. Open the [AWS IAM Console](https://console.aws.amazon.com/iam/) and go to **Users**.
2. Select your user (or create a new one), then go to **Security credentials**.
3. Click **Create access key** — copy both the Access Key ID and Secret Access Key.
4. Attach a policy granting only the Bedrock actions this integration uses: \`bedrock:ListFoundationModels\`, \`bedrock:ListInferenceProfiles\`, \`bedrock:InvokeModel\`, and \`bedrock:InvokeModelWithResponseStream\`. Avoid broad policies like **AmazonBedrockFullAccess** — follow least-privilege so a leaked key has limited blast radius.
5. In the [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/), go to **Model access** and request access to the models you want to use.`),
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
    provider: AIProviderName.DEEPSEEK,
    name: 'DeepSeek',
    logoUrl: 'https://cdn.activepieces.com/pieces/deepseek.png',
    markdown: t(`Follow these instructions to get your DeepSeek API Key:

1. Go to https://platform.deepseek.com/api_keys.
2. Click **Create new API key**, copy the key, and paste it below.
`),
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
    provider: AIProviderName.MINIMAX,
    name: 'MiniMax',
    logoUrl: 'https://cdn.activepieces.com/pieces/minimax.png',
    markdown: t(`Follow these instructions to get your MiniMax API Key:

1. Go to https://platform.minimax.io and sign in.
2. Open **API Keys** in your account settings, create a key, and paste it below.

This connects to MiniMax's international endpoint. A key from the China platform will not authenticate here — add that account through **Other (OpenAI Compatible)** with your China base URL instead.
`),
  },
  {
    provider: AIProviderName.MISTRAL,
    name: 'Mistral AI',
    logoUrl: 'https://cdn.activepieces.com/pieces/mistral-ai.png',
    markdown: t(`Follow these instructions to get your Mistral AI API Key:

1. Go to https://console.mistral.ai.
2. Navigate to **API Keys** in your account settings.
3. Click **Create new key**, copy the key, and paste it below.
`),
  },
  {
    provider: AIProviderName.MOONSHOT,
    name: 'Moonshot AI',
    logoUrl: 'https://cdn.activepieces.com/pieces/moonshot-ai.png',
    markdown:
      t(`Follow these instructions to get your Moonshot AI (Kimi) API Key:

1. Go to https://platform.moonshot.ai/console/api-keys.
2. Click **Create API key**, copy the key, and paste it below.

This connects to Moonshot's international endpoint. A key from the China platform will not authenticate here — add that account through **Other (OpenAI Compatible)** with your China base URL instead.
`),
  },
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
    provider: AIProviderName.OPENROUTER,
    name: 'OpenRouter',
    logoUrl: 'https://cdn.activepieces.com/pieces/openrouter.jpg',
    markdown: t(`Follow these instructions to get your OpenRouter API Key:
1. Go to https://openrouter.ai/settings/keys.
2. Once on the website, locate and click on the option to obtain your OpenRouter API Key.`),
  },
  {
    provider: AIProviderName.QWEN,
    name: 'Qwen',
    logoUrl: 'https://cdn.activepieces.com/pieces/qwen.png',
    markdown: t(`Follow these instructions to get your Qwen API Key:

1. Go to https://bailian.console.alibabacloud.com and sign in to Alibaba Cloud Model Studio.
2. Open **API-KEY**, create a key, and paste it below.

This connects to Model Studio's international (Singapore) endpoint. A key from the Beijing region will not authenticate here — add that account through **Other (OpenAI Compatible)** with your China base URL instead.
`),
  },
  {
    provider: AIProviderName.XAI,
    name: 'xAI',
    logoUrl: 'https://cdn.activepieces.com/pieces/grok-xai.png',
    markdown: t(`Follow these instructions to get your xAI API Key:

1. Go to https://console.x.ai and sign in.
2. Open **API Keys**, click **Create API key**, copy the key, and paste it below.
`),
  },
  {
    provider: AIProviderName.ZAI,
    name: 'Z.ai',
    logoUrl: 'https://cdn.activepieces.com/pieces/z-ai.png',
    markdown: t(`Follow these instructions to get your Z.ai (GLM) API Key:

1. Go to https://z.ai/manage-apikey/apikey-list and sign in.
2. Create an API key, copy it, and paste it below.

This connects to Z.ai's international endpoint. A key from bigmodel.cn will not authenticate here — add that account through **Other (OpenAI Compatible)** with your China base URL instead.
`),
  },
  {
    provider: AIProviderName.CUSTOM,
    name: 'Other (OpenAI Compatible)',
    logoUrl: 'https://cdn.activepieces.com/pieces/new-core/text-ai.svg',
    markdown:
      t(`Follow these instructions to get your OpenAI Compatible API Key:
1. Set the base url to your proxy url.
2. In the api key input, make sure to include any required prefix, i.e 'Bearer sk-****************'.
3. In the api key header, set the value of your auth header name (e.g. 'Authorization').`),
  },
];

export type AiProviderInfo = {
  provider: AIProviderName;
  name: string;
  markdown: string;
  logoUrl: string;
};
