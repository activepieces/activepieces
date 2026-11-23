import { AIProviderName } from '@activepieces/core-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const { providerCredentials } = await import(
  '@/app/routes/platform/setup/ai/providers-tab/provider-credentials'
);

describe('providerCredentials.fieldsOf', () => {
  it('keeps the LiteLLM URL and key up front and the rest under Advanced', () => {
    const fields = providerCredentials.fieldsOf({
      provider: AIProviderName.LITELLM,
    });

    expect(keysOf({ fields, advanced: false })).toEqual(['baseUrl', 'apiKey']);
    expect(keysOf({ fields, advanced: true })).toEqual([
      'apiKeyHeader',
      'typedModels',
      'defaultHeaders',
    ]);
  });

  it('gives Custom an API style instead of typed models', () => {
    const fields = providerCredentials.fieldsOf({
      provider: AIProviderName.CUSTOM,
    });

    expect(keysOf({ fields, advanced: true })).toEqual([
      'apiKeyHeader',
      'apiStyle',
      'defaultHeaders',
    ]);
  });

  it('defaults the API key header to Authorization, since it is hidden', () => {
    const header = providerCredentials
      .fieldsOf({ provider: AIProviderName.LITELLM })
      .find((field) => field.key === 'apiKeyHeader');

    expect(header?.defaultValue).toBe('Authorization');
  });

  it.each(Object.values(AIProviderName))(
    'never hides a required field without a default for %s',
    (provider) => {
      const hiddenAndEmpty = providerCredentials
        .fieldsOf({ provider })
        .filter(
          (field) => field.advanced && !field.optional && !field.defaultValue,
        );

      expect(hiddenAndEmpty).toEqual([]);
    },
  );
});

describe('providerCredentials.fieldOfServerError', () => {
  it.each([
    [
      'LiteLLM rejected the API key. Check the key and the API key header.',
      'apiKey',
    ],
    [
      'Activepieces blocked the request to http://127.0.0.1:4000/v1 because it points to a private or internal address.',
      'baseUrl',
    ],
    [
      'Could not list the models of the LiteLLM at https://x.example: timeout. Check the base URL, or add models by hand.',
      'baseUrl',
    ],
    [
      'The API key header cannot be sent as written. Enter the header name on its own',
      'apiKeyHeader',
    ],
  ])('maps "%s" to %s', (message, expected) => {
    expect(
      providerCredentials.fieldOfServerError({
        provider: AIProviderName.LITELLM,
        message,
      }),
    ).toBe(expected);
  });

  it('leaves an unknown error on the banner only', () => {
    expect(
      providerCredentials.fieldOfServerError({
        provider: AIProviderName.LITELLM,
        message: 'Something else went wrong',
      }),
    ).toBeUndefined();
  });

  it('skips a field the provider does not have', () => {
    expect(
      providerCredentials.fieldOfServerError({
        provider: AIProviderName.BEDROCK,
        message: 'Activepieces blocked the request to http://10.0.0.1',
      }),
    ).toBeUndefined();
  });
});

function keysOf({
  fields,
  advanced,
}: {
  fields: { key: string; advanced?: boolean }[];
  advanced: boolean;
}): string[] {
  return fields
    .filter((field) => Boolean(field.advanced) === advanced)
    .map((field) => field.key);
}
