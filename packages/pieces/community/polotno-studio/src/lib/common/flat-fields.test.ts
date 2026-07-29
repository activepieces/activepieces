import { describe, expect, it } from 'vitest';
import type { FieldDef } from './types';
import { toFlatFields } from './flat-fields';

const def = ({ key, type }: { key: string; type: FieldDef['type'] }): FieldDef => ({
  key,
  label: key,
  type,
  required: false,
});

const DEFS: FieldDef[] = [
  def({ key: 'fields__headline__text', type: 'string' }),
  def({ key: 'fields__logo__image_url', type: 'url' }),
  def({ key: 'fields__badge__visible', type: 'boolean' }),
  def({ key: 'fields__headline__font_size', type: 'integer' }),
  def({ key: 'fields__headline__color', type: 'color' }),
  def({ key: 'fields__deep__name__with__underscores__text', type: 'string' }),
];

describe('toFlatFields', () => {
  it('passes keys through verbatim, including element names containing __', () => {
    const out = toFlatFields({
      defs: DEFS,
      values: {
        'fields__headline__text': 'Hello',
        'fields__deep__name__with__underscores__text': 'Deep',
      },
    });
    expect(out).toEqual({
      'fields__headline__text': 'Hello',
      'fields__deep__name__with__underscores__text': 'Deep',
    });
  });

  it('treats a blank string as unset rather than sending an empty value', () => {
    expect(toFlatFields({ defs: DEFS, values: { 'fields__headline__text': '' } })).toEqual({});
  });

  it('treats a blank integer as unset instead of 0', () => {
    expect(toFlatFields({ defs: DEFS, values: { 'fields__headline__font_size': '' } })).toEqual({});
  });

  it('coerces a numeric string to a number', () => {
    expect(toFlatFields({ defs: DEFS, values: { 'fields__headline__font_size': '48' } })).toEqual({
      'fields__headline__font_size': 48,
    });
  });

  it('keeps an explicit false', () => {
    expect(toFlatFields({ defs: DEFS, values: { 'fields__badge__visible': false } })).toEqual({
      'fields__badge__visible': false,
    });
  });

  it('coerces string booleans from no-code inputs', () => {
    expect(toFlatFields({ defs: DEFS, values: { 'fields__badge__visible': 'false' } })).toEqual({
      'fields__badge__visible': false,
    });
  });

  it('drops null and undefined', () => {
    expect(
      toFlatFields({
        defs: DEFS,
        values: { 'fields__headline__text': null, 'fields__logo__image_url': undefined },
      }),
    ).toEqual({});
  });

  it('passes an unknown key through so the server can reject it', () => {
    expect(toFlatFields({ defs: DEFS, values: { 'fields__ghost__text': 'x' } })).toEqual({
      'fields__ghost__text': 'x',
    });
  });
});
