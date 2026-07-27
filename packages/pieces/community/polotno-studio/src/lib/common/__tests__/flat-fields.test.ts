import { describe, expect, it } from 'vitest';
import type { FieldDef } from '../types';
import { toFlatFields } from '../flat-fields';

const def = (key: string, type: FieldDef['type']): FieldDef => ({ key, label: key, type, required: false });

const DEFS: FieldDef[] = [
  def('fields__headline__text', 'string'),
  def('fields__logo__image_url', 'url'),
  def('fields__badge__visible', 'boolean'),
  def('fields__headline__font_size', 'integer'),
  def('fields__headline__color', 'color'),
  def('fields__deep__name__with__underscores__text', 'string'),
];

describe('toFlatFields', () => {
  it('passes keys through verbatim, including element names containing __', () => {
    const out = toFlatFields(DEFS, {
      'fields__headline__text': 'Hello',
      'fields__deep__name__with__underscores__text': 'Deep',
    });
    expect(out).toEqual({
      'fields__headline__text': 'Hello',
      'fields__deep__name__with__underscores__text': 'Deep',
    });
  });

  it('treats a blank string as unset rather than sending an empty value', () => {
    expect(toFlatFields(DEFS, { 'fields__headline__text': '' })).toEqual({});
  });

  it('treats a blank integer as unset instead of 0', () => {
    expect(toFlatFields(DEFS, { 'fields__headline__font_size': '' })).toEqual({});
  });

  it('coerces a numeric string to a number', () => {
    expect(toFlatFields(DEFS, { 'fields__headline__font_size': '48' })).toEqual({
      'fields__headline__font_size': 48,
    });
  });

  it('keeps an explicit false', () => {
    expect(toFlatFields(DEFS, { 'fields__badge__visible': false })).toEqual({
      'fields__badge__visible': false,
    });
  });

  it('coerces string booleans from no-code inputs', () => {
    expect(toFlatFields(DEFS, { 'fields__badge__visible': 'false' })).toEqual({
      'fields__badge__visible': false,
    });
  });

  it('drops null and undefined', () => {
    expect(toFlatFields(DEFS, { 'fields__headline__text': null, 'fields__logo__image_url': undefined })).toEqual({});
  });

  it('passes an unknown key through so the server can reject it', () => {
    expect(toFlatFields(DEFS, { 'fields__ghost__text': 'x' })).toEqual({ 'fields__ghost__text': 'x' });
  });
});
