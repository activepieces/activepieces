import { readFileSync } from 'fs';
import path from 'path';

import { AIProviderName } from '@activepieces/core-utils';
import { describe, expect, it, vi } from 'vitest';

import { SUPPORTED_AI_PROVIDERS } from '@/features/agents/ai-providers';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const translations: Record<string, string> = JSON.parse(
  readFileSync(
    path.resolve(__dirname, '../../../public/locales/en/translation.json'),
    'utf-8',
  ),
);

describe('AI provider setup instructions', () => {
  it('sends Google Gemini users to the AI Studio API keys page', () => {
    const gemini = SUPPORTED_AI_PROVIDERS.find(
      (info) => info.provider === AIProviderName.GOOGLE,
    );
    const markdown = gemini?.markdown() ?? '';

    expect(markdown).toContain('https://aistudio.google.com/api-keys');
    expect(markdown).not.toContain('console.cloud.google.com');
  });

  it.each(SUPPORTED_AI_PROVIDERS)(
    'has English text for the $name instructions',
    (info) => {
      expect(translations[info.markdown()]).toBeTruthy();
    },
  );
});
