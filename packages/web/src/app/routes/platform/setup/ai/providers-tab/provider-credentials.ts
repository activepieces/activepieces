import { AIProviderName } from '@activepieces/core-utils';
import { t } from 'i18next';

import { AWS_BEDROCK_REGIONS } from '@/features/agents/aws-regions';

function fieldsOf({
  provider,
}: {
  provider: AIProviderName;
}): CredentialField[] {
  return PROVIDER_CREDENTIAL_FIELDS[provider] ?? DEFAULT_CREDENTIAL_FIELDS;
}

function secretKeysOf({ provider }: { provider: AIProviderName }): string[] {
  return fieldsOf({ provider })
    .filter((field) => field.secret)
    .map((field) => field.key);
}

function usesManualModels({ provider }: { provider: AIProviderName }): boolean {
  return MANUAL_MODEL_PROVIDERS.includes(provider);
}

const DEFAULT_CREDENTIAL_FIELDS: CredentialField[] = [
  {
    key: 'apiKey',
    label: t('API key'),
    placeholder: 'sk-************************',
    secret: true,
  },
];

const PROVIDER_CREDENTIAL_FIELDS: Partial<
  Record<AIProviderName, CredentialField[]>
> = {
  [AIProviderName.AZURE]: [
    {
      key: 'apiKey',
      label: t('API key'),
      placeholder: 'sk-************************',
      secret: true,
    },
    {
      key: 'resourceName',
      label: t('Resource name'),
      placeholder: 'your-resource-name',
    },
    {
      key: 'apiVersion',
      label: t('API version'),
      placeholder: '2024-10-21',
      optional: true,
      description: t(
        'Leave empty to use the default. Some Azure resources require a different version, e.g. 2023-03-15-preview.',
      ),
    },
  ],
  [AIProviderName.BEDROCK]: [
    {
      key: 'accessKeyId',
      label: t('AWS access key ID'),
      placeholder: 'AKIA************',
      secret: true,
    },
    {
      key: 'secretAccessKey',
      label: t('AWS secret access key'),
      placeholder: '****************************************',
      secret: true,
    },
    {
      key: 'region',
      label: t('AWS region'),
      options: AWS_BEDROCK_REGIONS.map((region) => ({ ...region })),
    },
  ],
  [AIProviderName.CLOUDFLARE_GATEWAY]: [
    {
      key: 'apiKey',
      label: t('AI Gateway token'),
      placeholder: '************************',
      secret: true,
    },
    {
      key: 'accountId',
      label: t('Account ID'),
      placeholder: 'your-account-id',
    },
    {
      key: 'gatewayId',
      label: t('Gateway ID'),
      placeholder: 'your-gateway-id',
    },
    {
      key: 'vertexRegion',
      label: t('Google Vertex project region'),
      placeholder: 'global',
      optional: true,
    },
    {
      key: 'vertexProject',
      label: t('Google Vertex project ID'),
      placeholder: 'project-1234',
      optional: true,
    },
  ],
  [AIProviderName.CUSTOM]: [
    {
      key: 'baseUrl',
      label: t('Base URL'),
      placeholder: 'https://api.example.com/v1',
    },
    {
      key: 'apiKey',
      label: t('API key'),
      placeholder: 'sk-************************',
      secret: true,
    },
    {
      key: 'apiKeyHeader',
      label: t('API key header'),
      placeholder: 'Authorization',
    },
    {
      key: 'apiStyle',
      label: t('API style'),
      optional: true,
      description: t(
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
    },
  ],
};

const MANUAL_MODEL_PROVIDERS: AIProviderName[] = [
  AIProviderName.CUSTOM,
  AIProviderName.CLOUDFLARE_GATEWAY,
];

export const providerCredentials = {
  fieldsOf,
  secretKeysOf,
  usesManualModels,
};

export type CredentialField = {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
  optional?: boolean;
  description?: string;
  options?: { value: string; label: string }[];
  type?: 'dictionary';
};
