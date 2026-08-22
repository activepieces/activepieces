import { AIProviderName } from '@activepieces/core-utils';
import { describe, expect, it } from 'vitest';

import { createFormSchema } from '@/app/routes/platform/setup/ai/universal-pieces/provider-form-schema';

const OPENAI_COMPATIBLE_VENDORS = [
  AIProviderName.XAI,
  AIProviderName.DEEPSEEK,
  AIProviderName.ZAI,
  AIProviderName.QWEN,
  AIProviderName.MINIMAX,
  AIProviderName.MOONSHOT,
];

describe('createFormSchema', () => {
  it.each(OPENAI_COMPATIBLE_VENDORS)(
    'keeps the selected region for %s instead of stripping it before submit',
    (provider) => {
      const parsed = createFormSchema(provider, false).parse({
        displayName: 'vendor',
        provider,
        config: { region: 'china' },
        auth: { apiKey: 'k' },
      });

      expect(parsed.config).toEqual({ region: 'china' });
    },
  );

  it('still accepts an empty config for a provider that has none', () => {
    const parsed = createFormSchema(AIProviderName.OPENAI, false).parse({
      displayName: 'OpenAI',
      provider: AIProviderName.OPENAI,
      config: {},
      auth: { apiKey: 'k' },
    });

    expect(parsed.config).toEqual({});
  });
});
