import { describe, it, expect } from 'vitest';

import { hintUtils } from '@/components/custom/smart-output-viewer/resolve-hints';
import type {
  HintField,
  OutputDisplayHints,
} from '@/components/custom/smart-output-viewer/types';
import { stringUtils } from '@/lib/string-utils';

describe('stringUtils.titleCase', () => {
  it('humanises camelCase keys', () => {
    expect(stringUtils.titleCase('firstName')).toBe('First Name');
  });

  it('humanises snake_case keys', () => {
    expect(stringUtils.titleCase('first_name')).toBe('First Name');
  });

  it('humanises kebab-case keys', () => {
    expect(stringUtils.titleCase('first-name')).toBe('First Name');
  });

  it('returns single-word keys capitalised', () => {
    expect(stringUtils.titleCase('id')).toBe('Id');
  });
});

describe('hintUtils.resolveFieldLabel', () => {
  it('uses the explicit label when present', () => {
    const field: HintField = { key: 'firstName', label: 'Given Name' };
    expect(hintUtils.resolveFieldLabel(field)).toBe('Given Name');
  });

  it('falls back to title-cased key when no label is given', () => {
    const field: HintField = { key: 'firstName' };
    expect(hintUtils.resolveFieldLabel(field)).toBe('First Name');
  });
});

describe('hintUtils.resolveFieldPath', () => {
  it('uses the explicit value path when present', () => {
    const field: HintField = { key: 'id', value: 'data.uuid' };
    expect(hintUtils.resolveFieldPath(field)).toBe('data.uuid');
  });

  it('uses the key when no value path is given', () => {
    const field: HintField = { key: 'id' };
    expect(hintUtils.resolveFieldPath(field)).toBe('id');
  });

  it('joins parent path and key when no explicit value is given', () => {
    const field: HintField = { key: 'name' };
    expect(hintUtils.resolveFieldPath(field, 'user')).toBe('user.name');
  });

  it('ignores parent path when an explicit value path is provided', () => {
    const field: HintField = { key: 'name', value: 'absolute.path' };
    expect(hintUtils.resolveFieldPath(field, 'user')).toBe('absolute.path');
  });
});

describe('hintUtils.resolveItemFieldPath', () => {
  it('uses value when present', () => {
    const field: HintField = { key: 'id', value: 'uuid' };
    expect(hintUtils.resolveItemFieldPath(field)).toBe('uuid');
  });

  it('falls back to key', () => {
    const field: HintField = { key: 'id' };
    expect(hintUtils.resolveItemFieldPath(field)).toBe('id');
  });
});

describe('hintUtils.visibleFields', () => {
  it('returns hero and secondary arrays', () => {
    const hints: OutputDisplayHints = {
      hero: [{ key: 'a' }],
      secondary: [{ key: 'b' }],
    };
    expect(hintUtils.visibleFields(hints)).toEqual({
      hero: [{ key: 'a' }],
      secondary: [{ key: 'b' }],
    });
  });

  it('defaults secondary to an empty array when missing', () => {
    const hints: OutputDisplayHints = { hero: [{ key: 'a' }] };
    expect(hintUtils.visibleFields(hints).secondary).toEqual([]);
  });
});

describe('hintUtils.isPrimitiveArray', () => {
  it('returns true for an array of strings', () => {
    expect(hintUtils.isPrimitiveArray(['INBOX', 'UNREAD'])).toBe(true);
  });

  it('returns true for an array of numbers', () => {
    expect(hintUtils.isPrimitiveArray([1, 2, 3])).toBe(true);
  });

  it('returns true for an array of booleans', () => {
    expect(hintUtils.isPrimitiveArray([true, false])).toBe(true);
  });

  it('treats null entries as primitive', () => {
    expect(hintUtils.isPrimitiveArray(['a', null])).toBe(true);
  });

  it('returns true for an empty array', () => {
    expect(hintUtils.isPrimitiveArray([])).toBe(true);
  });

  it('returns false for an array containing an object', () => {
    expect(hintUtils.isPrimitiveArray([{ id: 1 }])).toBe(false);
  });

  it('returns false for an array containing a nested array', () => {
    expect(hintUtils.isPrimitiveArray([['a']])).toBe(false);
  });

  it('returns false for non-array inputs', () => {
    expect(hintUtils.isPrimitiveArray('hello')).toBe(false);
    expect(hintUtils.isPrimitiveArray(null)).toBe(false);
    expect(hintUtils.isPrimitiveArray({ length: 0 })).toBe(false);
  });
});
