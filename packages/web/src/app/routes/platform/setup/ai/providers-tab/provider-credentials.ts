import { AIProviderName } from '@activepieces/core-utils';
import { t } from 'i18next';

import { AWS_BEDROCK_REGIONS } from '@/features/agents/aws-regions';

function fieldsOf({
  provider,
}: {
  provider: AIProviderName;
}): CredentialField[] {
  switch (provider) {
    case AIProviderName.AZURE:
      return azureFields();
    case AIProviderName.BEDROCK:
      return bedrockFields();
    case AIProviderName.CLOUDFLARE_GATEWAY:
      return cloudflareFields();
    case AIProviderName.VERTEX:
      return vertexFields();
    case AIProviderName.CUSTOM:
      return openAiCompatibleFields({ withApiStyle: true });
    case AIProviderName.LITELLM:
      return openAiCompatibleFields({ withApiStyle: false });
    default:
      return [apiKeyField()];
  }
}

function secretKeysOf({ provider }: { provider: AIProviderName }): string[] {
  return fieldsOf({ provider })
    .filter((field) => field.secret)
    .map((field) => field.key);
}

function usesManualModels({ provider }: { provider: AIProviderName }): boolean {
  return MANUAL_MODEL_PROVIDERS.includes(provider);
}

function fieldOfServerError({
  provider,
  message,
}: {
  provider: AIProviderName;
  message: string;
}): string | undefined {
  const keys = fieldsOf({ provider }).map((field) => field.key);
  return SERVER_ERROR_FIELDS.find(
    ({ key, pattern }) => keys.includes(key) && pattern.test(message),
  )?.key;
}

function apiKeyField(): CredentialField {
  return {
    key: 'apiKey',
    label: t('API key'),
    placeholder: 'sk-************************',
    secret: true,
    help: t(
      'Stored encrypted. You can replace it later, but never read it back.',
    ),
  };
}

function openAiCompatibleFields({
  withApiStyle,
}: {
  withApiStyle: boolean;
}): CredentialField[] {
  const fields: CredentialField[] = [
    {
      key: 'baseUrl',
      label: t('Base URL'),
      placeholder: 'https://api.example.com/v1',
      help: t(
        'The address of the OpenAI-compatible API, usually ending in /v1.',
      ),
    },
    {
      key: 'apiKey',
      label: t('API key'),
      placeholder: 'sk-************************',
      secret: true,
      help: t('The key the API expects. Stored encrypted.'),
    },
    {
      key: 'apiKeyHeader',
      label: t('API key header'),
      placeholder: 'Authorization',
      defaultValue: 'Authorization',
      advanced: true,
      help: withApiStyle
        ? t(
            'The header that carries the key. The key is sent exactly as typed, so add the Bearer prefix to the key if the API needs it.',
          )
        : t(
            'The header that carries the key. Authorization sends it as a Bearer token; any other name sends the key as it is.',
          ),
    },
    {
      key: 'typedModels',
      label: t('Models'),
      placeholder: 'prod-smart, openai/gpt-4o',
      optional: true,
      advanced: true,
      help: t(
        'Comma-separated model ids to add by hand, for wildcard routes or a proxy that cannot be reached from here. Models your proxy lists are added on save.',
      ),
    },
    {
      key: 'apiStyle',
      label: t('API style'),
      optional: true,
      advanced: true,
      help: t(
        'Chat completions suits most gateways. Pick Responses for endpoints that only serve the newer OpenAI Responses API, such as Amazon Bedrock.',
      ),
      options: [
        { value: 'chat', label: t('Chat completions') },
        { value: 'responses', label: t('Responses') },
      ],
    },
    {
      key: 'defaultHeaders',
      label: t('Custom headers'),
      type: 'dictionary',
      optional: true,
      advanced: true,
      help: t('Extra headers sent with every request, such as a tenant id.'),
    },
  ];
  return fields.filter((field) =>
    withApiStyle ? field.key !== 'typedModels' : field.key !== 'apiStyle',
  );
}

function azureFields(): CredentialField[] {
  return [
    apiKeyField(),
    {
      key: 'resourceName',
      label: t('Resource name'),
      placeholder: 'your-resource-name',
      help: t(
        'The name of your Azure OpenAI resource, the part before .openai.azure.com.',
      ),
    },
    {
      key: 'apiVersion',
      label: t('API version'),
      placeholder: '2024-10-21',
      optional: true,
      advanced: true,
      help: t(
        'Leave empty to use the default. Some Azure resources require a different version, e.g. 2023-03-15-preview.',
      ),
    },
  ];
}

function bedrockFields(): CredentialField[] {
  return [
    {
      key: 'accessKeyId',
      label: t('AWS access key ID'),
      placeholder: 'AKIA************',
      secret: true,
      help: t('From an IAM user or role allowed to call Bedrock.'),
    },
    {
      key: 'secretAccessKey',
      label: t('AWS secret access key'),
      placeholder: '****************************************',
      secret: true,
      help: t('Shown once by AWS when the access key is created.'),
    },
    {
      key: 'region',
      label: t('AWS region'),
      options: AWS_BEDROCK_REGIONS.map((region) => ({ ...region })),
      help: t('The region where your Bedrock models are enabled.'),
    },
    {
      key: 'sessionToken',
      label: t('AWS session token'),
      placeholder: '****************************************',
      secret: true,
      optional: true,
      advanced: true,
      help: t(
        'Only for temporary credentials from AWS SSO or STS. They expire.',
      ),
    },
  ];
}

function cloudflareFields(): CredentialField[] {
  return [
    {
      key: 'apiKey',
      label: t('AI Gateway token'),
      placeholder: '************************',
      secret: true,
      help: t('A Cloudflare API token with access to AI Gateway.'),
    },
    {
      key: 'accountId',
      label: t('Account ID'),
      placeholder: 'your-account-id',
      help: t('Shown on your Cloudflare dashboard overview.'),
    },
    {
      key: 'gatewayId',
      label: t('Gateway ID'),
      placeholder: 'your-gateway-id',
      help: t('The name of the gateway under AI, then AI Gateway.'),
    },
    {
      key: 'vertexRegion',
      label: t('Google Vertex project region'),
      placeholder: 'global',
      optional: true,
      advanced: true,
      help: t('Only needed to route Google Vertex models through the gateway.'),
    },
    {
      key: 'vertexProject',
      label: t('Google Vertex project ID'),
      placeholder: 'project-1234',
      optional: true,
      advanced: true,
      help: t('Only needed to route Google Vertex models through the gateway.'),
    },
  ];
}

function vertexFields(): CredentialField[] {
  return [
    {
      key: 'serviceAccountJson',
      label: t('Service account JSON'),
      placeholder: '{"type":"service_account", ...}',
      secret: true,
      type: 'textarea',
      help: t(
        'The complete JSON key file for a service account with the Vertex AI User role.',
      ),
    },
    {
      key: 'project',
      label: t('Google Cloud project ID'),
      placeholder: 'my-gcp-project',
      help: t('The project that owns the service account.'),
    },
    {
      key: 'region',
      label: t('Region'),
      placeholder: 'us-central1',
      help: t('Where Vertex AI serves your models.'),
    },
  ];
}

const MANUAL_MODEL_PROVIDERS: AIProviderName[] = [
  AIProviderName.VERTEX,
  AIProviderName.CUSTOM,
  AIProviderName.CLOUDFLARE_GATEWAY,
];

const SERVER_ERROR_FIELDS: { key: string; pattern: RegExp }[] = [
  { key: 'apiKeyHeader', pattern: /API key header cannot be sent/i },
  { key: 'apiKey', pattern: /rejected the API key/i },
  {
    key: 'baseUrl',
    pattern: /blocked the request to|could not list the models/i,
  },
];

export const providerCredentials = {
  fieldsOf,
  secretKeysOf,
  usesManualModels,
  fieldOfServerError,
};

export type CredentialField = {
  key: string;
  label: string;
  help: string;
  placeholder?: string;
  secret?: boolean;
  optional?: boolean;
  advanced?: boolean;
  defaultValue?: string;
  options?: { value: string; label: string }[];
  type?: 'dictionary' | 'textarea';
};
