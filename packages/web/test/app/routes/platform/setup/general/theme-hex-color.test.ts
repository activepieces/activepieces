import { readFileSync } from 'fs';
import path from 'path';

import { ThemeHexColor } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

const translations: Record<string, string> = JSON.parse(
  readFileSync(
    path.resolve(
      __dirname,
      '../../../../../../public/locales/en/translation.json',
    ),
    'utf-8',
  ),
);

describe('theme colour schema', () => {
  it.each(['red', '#12', '#gggggg'])(
    'renders readable English for %s instead of a raw zod message',
    (input) => {
      const result = ThemeHexColor.safeParse(input);

      expect(result.success).toBe(false);
      expect(translations[result.error?.issues[0].message ?? '']).toBe(
        'Enter a color as #abc or #aabbcc',
      );
    },
  );

  it.each(['#abc', '#aabbcc'])('accepts %s', (input) => {
    expect(ThemeHexColor.safeParse(input).success).toBe(true);
  });
});
