import { describe, expect, it } from 'vitest';

import { googleTranslate } from '../src/index';

describe('googleTranslate piece', () => {
  it('should expose the production display name', () => {
    expect(googleTranslate.displayName).toBe('Google Translate');
  });

  it('should register exactly the expected actions', () => {
    expect(Object.keys(googleTranslate.actions()).sort()).toEqual([
      'custom_api_call',
      'detectLanguage',
      'listLanguages',
      'translateText',
    ]);
  });
});
