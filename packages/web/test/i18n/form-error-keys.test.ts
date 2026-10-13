import { readFileSync } from 'fs';
import path from 'path';

import { formErrors } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

const translations: Record<string, string> = JSON.parse(
  readFileSync(
    path.resolve(__dirname, '../../public/locales/en/translation.json'),
    'utf-8',
  ),
);

describe('formErrors translations', () => {
  it.each(Object.values(formErrors))('has English text for %s', (key) => {
    expect(translations[key]).toBeDefined();
    expect(translations[key]).not.toBe(key);
  });
});
