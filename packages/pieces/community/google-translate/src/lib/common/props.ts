import { Property } from '@activepieces/pieces-framework';
import type { DropdownState } from '@activepieces/pieces-framework';

import { googleTranslateAuth } from '../auth';
import { GoogleTranslateApi } from './client';

export async function languageOptions(
  auth: LanguageOptionsAuth | undefined
): Promise<DropdownState<string>> {
  const accessToken = auth?.access_token;
  if (!accessToken) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Please select an existing or create a new connection.',
    };
  }

  try {
    const languages = await GoogleTranslateApi.languages({ accessToken, target: 'en' });
    const options = languages
      .filter((language) => !LEGACY_LANGUAGE_CODES.has(language.language))
      .map((language) => ({
        label: language.name ? `${language.name} (${language.language})` : language.language,
        value: language.language,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return { disabled: false, options };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: 'An error occurred while fetching the supported languages.',
    };
  }
}

const LEGACY_LANGUAGE_CODES = new Set(['iw', 'jw']);

export const targetLanguageProp = Property.Dropdown<string, true, typeof googleTranslateAuth>({
  displayName: 'Target Language',
  description: 'Language to translate into.',
  required: true,
  auth: googleTranslateAuth,
  refreshers: [],
  options: async ({ auth }) => languageOptions(auth),
});

export const sourceLanguageProp = Property.Dropdown<string, false, typeof googleTranslateAuth>({
  displayName: 'Source Language',
  description: 'Leave empty to let Google detect the language of the text.',
  required: false,
  auth: googleTranslateAuth,
  refreshers: [],
  options: async ({ auth }) => languageOptions(auth),
});

type LanguageOptionsAuth = {
  access_token?: string;
};
