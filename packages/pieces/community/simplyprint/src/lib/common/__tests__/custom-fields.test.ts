import { describe, expect, it } from 'vitest';

import { simplyprintCustomFields } from '../custom-fields';

const { toSubmissionArray } = simplyprintCustomFields;

describe('toSubmissionArray', () => {
  it('returns [] for null / undefined / non-objects', () => {
    expect(toSubmissionArray(null)).toEqual([]);
    expect(toSubmissionArray(undefined)).toEqual([]);
    expect(toSubmissionArray({} as Record<string, unknown>)).toEqual([]);
    expect(toSubmissionArray('not an object' as unknown as Record<string, unknown>)).toEqual([]);
  });

  it('maps string values to { string: value }', () => {
    expect(toSubmissionArray({ project: 'acme' })).toEqual([
      { customFieldId: 'project', value: { string: 'acme' } },
    ]);
  });

  it('maps numeric-looking strings to { number }', () => {
    expect(toSubmissionArray({ temp: '215' })).toEqual([
      { customFieldId: 'temp', value: { number: 215 } },
    ]);
    expect(toSubmissionArray({ temp: '-4.5' })).toEqual([
      { customFieldId: 'temp', value: { number: -4.5 } },
    ]);
  });

  // 1e3 is a valid Number() but the strict regex rejects it — avoids
  // surprising the user when a field_id like "1e3" looks numeric.
  it('does NOT coerce scientific or hex strings to numbers', () => {
    expect(toSubmissionArray({ code: '1e3' })).toEqual([
      { customFieldId: 'code', value: { string: '1e3' } },
    ]);
    expect(toSubmissionArray({ code: '0xff' })).toEqual([
      { customFieldId: 'code', value: { string: '0xff' } },
    ]);
  });

  it('maps raw numbers to { number }', () => {
    expect(toSubmissionArray({ temp: 215 })).toEqual([
      { customFieldId: 'temp', value: { number: 215 } },
    ]);
  });

  it('maps raw booleans and lowercase "true"/"false" strings to { boolean }', () => {
    expect(toSubmissionArray({ on: true })).toEqual([
      { customFieldId: 'on', value: { boolean: true } },
    ]);
    expect(toSubmissionArray({ on: 'true' })).toEqual([
      { customFieldId: 'on', value: { boolean: true } },
    ]);
    expect(toSubmissionArray({ on: ' false ' })).toEqual([
      { customFieldId: 'on', value: { boolean: false } },
    ]);
  });

  // A field_id literally named "FALSE" (unusual but legal) should stay as a
  // string so we don't lose information.
  it('does NOT coerce uppercase / mixed-case "True"/"FALSE" strings to booleans', () => {
    expect(toSubmissionArray({ on: 'FALSE' })).toEqual([
      { customFieldId: 'on', value: { string: 'FALSE' } },
    ]);
    expect(toSubmissionArray({ on: 'True' })).toEqual([
      { customFieldId: 'on', value: { string: 'True' } },
    ]);
  });

  it('maps Date instances to ISO { date } strings', () => {
    const d = new Date('2026-04-23T10:00:00.000Z');
    expect(toSubmissionArray({ deadline: d })).toEqual([
      { customFieldId: 'deadline', value: { date: '2026-04-23T10:00:00.000Z' } },
    ]);
  });

  it('maps arrays to { options } of stringified entries', () => {
    expect(toSubmissionArray({ tags: ['red', 'blue', 7] })).toEqual([
      { customFieldId: 'tags', value: { options: ['red', 'blue', '7'] } },
    ]);
  });

  it('maps null/undefined values to { string: "" }', () => {
    expect(toSubmissionArray({ note: null })).toEqual([
      { customFieldId: 'note', value: { string: '' } },
    ]);
    expect(toSubmissionArray({ note: undefined })).toEqual([
      { customFieldId: 'note', value: { string: '' } },
    ]);
  });

  it('preserves insertion order and keeps all keys except empty-string keys', () => {
    const result = toSubmissionArray({
      a: 'x',
      '': 'skipped',
      b: 1,
      c: true,
    });
    expect(result.map((r) => r.customFieldId)).toEqual(['a', 'b', 'c']);
  });

  it('accepts UUID-style custom field IDs (the expected production shape)', () => {
    const fieldId = '7d4e6f0a-9c3b-4b2a-8e1d-3c5a2b1f0d9e';
    expect(toSubmissionArray({ [fieldId]: 'PETG' })).toEqual([
      { customFieldId: fieldId, value: { string: 'PETG' } },
    ]);
  });
});
