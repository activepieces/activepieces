import { describe, expect, it } from 'vitest';
import { PropertyType } from '@activepieces/pieces-framework';
import type { FieldDef } from '../types';
import { fieldsToProps } from '../props';

const field = (over: Partial<FieldDef>): FieldDef => ({
  key: 'fields__x__text', label: 'X', type: 'string', required: false, ...over,
});

describe('fieldsToProps', () => {
  it('keys props by the flat key verbatim', () => {
    const props = fieldsToProps([field({ key: 'fields__deep__name__text' })]);
    expect(Object.keys(props)).toEqual(['fields__deep__name__text']);
  });

  it('maps each API type to the right property type', () => {
    const props = fieldsToProps([
      field({ key: 'a', type: 'string' }),
      field({ key: 'b', type: 'url' }),
      field({ key: 'c', type: 'integer' }),
      field({ key: 'd', type: 'color' }),
      field({ key: 'e', type: 'boolean' }),
    ]);
    expect(props['a'].type).toBe(PropertyType.SHORT_TEXT);
    expect(props['b'].type).toBe(PropertyType.SHORT_TEXT);
    expect(props['c'].type).toBe(PropertyType.NUMBER);
    expect(props['d'].type).toBe(PropertyType.COLOR);
    expect(props['e'].type).toBe(PropertyType.CHECKBOX);
  });

  it('carries label, required, help text and default across', () => {
    const props = fieldsToProps([
      field({ key: 'a', label: 'Headline', required: true, help_text: 'Top line', default: 'Hi' }),
    ]);
    expect(props['a'].displayName).toBe('Headline');
    expect(props['a'].required).toBe(true);
    expect(props['a'].description).toBe('Top line');
    expect(props['a'].defaultValue).toBe('Hi');
  });

  it('returns an empty map for no fields', () => {
    expect(fieldsToProps([])).toEqual({});
  });
});
