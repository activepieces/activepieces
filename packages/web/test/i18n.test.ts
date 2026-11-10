/**
 * @vitest-environment jsdom
 */
import i18n from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@/i18n';

vi.mock('i18next-http-backend', () => ({
  default: {
    type: 'backend',
    init: () => undefined,
    read: (
      _language: string,
      _namespace: string,
      callback: (error: null, data: Record<string, string>) => void,
    ) => callback(null, {}),
  },
}));

async function detectLanguage({
  browserLanguages,
  cachedLanguage,
}: {
  browserLanguages: string[];
  cachedLanguage?: string;
}): Promise<string> {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(browserLanguages);
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(browserLanguages[0]);
  localStorage.clear();
  if (cachedLanguage) {
    localStorage.setItem('i18nextLng', cachedLanguage);
  }
  await i18n.changeLanguage();
  return i18n.language;
}

describe('i18n language detection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('picks English for an English-first browser with a partially translated language second', async () => {
    expect(await detectLanguage({ browserLanguages: ['en-US', 'ar'] })).toBe(
      'en',
    );
  });

  it('ignores a partially translated language cached from an earlier visit', async () => {
    expect(
      await detectLanguage({
        browserLanguages: ['en-US', 'ar'],
        cachedLanguage: 'ar',
      }),
    ).toBe('en');
  });

  it('falls back to English when only a partially translated language is requested', async () => {
    expect(await detectLanguage({ browserLanguages: ['ar-SA'] })).toBe('en');
  });

  it('keeps a language the user picked', async () => {
    expect(
      await detectLanguage({
        browserLanguages: ['en-US'],
        cachedLanguage: 'fr',
      }),
    ).toBe('fr');
  });

  it('keeps exact regional languages offered in the selector', async () => {
    expect(await detectLanguage({ browserLanguages: ['zh-TW', 'en'] })).toBe(
      'zh-TW',
    );
  });

  it('matches a regional browser language to its selectable base language', async () => {
    expect(await detectLanguage({ browserLanguages: ['fr-FR'] })).toBe('fr');
  });
});
