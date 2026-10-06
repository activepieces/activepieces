import { describe, expect, it } from 'vitest';

import { googleTranslate } from '../src/index';

describe('googleTranslate piece', () => {
  it('should expose the production display name', () => {
    expect(googleTranslate.displayName).toBe('Google Translate');
  });

  it('should register every action under a unique name', () => {
    const names = Object.keys(googleTranslate.actions());

    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });
});
