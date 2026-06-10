import { describe, it, expect } from 'vitest';

import { schemaUtils } from '@/components/custom/smart-output-viewer/resolve-schema';
import type { OutputSchemaField } from '@/components/custom/smart-output-viewer/types';
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

describe('schemaUtils.resolveFieldLabel', () => {
  it('uses the explicit label when present', () => {
    const field: OutputSchemaField = { key: 'firstName', label: 'Given Name' };
    expect(schemaUtils.resolveFieldLabel(field)).toBe('Given Name');
  });

  it('falls back to title-cased key when no label is given', () => {
    const field: OutputSchemaField = { key: 'firstName' };
    expect(schemaUtils.resolveFieldLabel(field)).toBe('First Name');
  });
});

describe('schemaUtils.resolveFieldPath', () => {
  it('uses the explicit value path when present', () => {
    const field: OutputSchemaField = { key: 'id', value: 'data.uuid' };
    expect(schemaUtils.resolveFieldPath(field)).toBe('data.uuid');
  });

  it('uses the key when no value path is given', () => {
    const field: OutputSchemaField = { key: 'id' };
    expect(schemaUtils.resolveFieldPath(field)).toBe('id');
  });

  it('joins parent path and key when no explicit value is given', () => {
    const field: OutputSchemaField = { key: 'name' };
    expect(schemaUtils.resolveFieldPath(field, 'user')).toBe('user.name');
  });

  it('ignores parent path when an explicit value path is provided', () => {
    const field: OutputSchemaField = { key: 'name', value: 'absolute.path' };
    expect(schemaUtils.resolveFieldPath(field, 'user')).toBe('absolute.path');
  });
});

describe('schemaUtils.resolveItemFieldPath', () => {
  it('uses value when present', () => {
    const field: OutputSchemaField = { key: 'id', value: 'uuid' };
    expect(schemaUtils.resolveItemFieldPath(field)).toBe('uuid');
  });

  it('falls back to key', () => {
    const field: OutputSchemaField = { key: 'id' };
    expect(schemaUtils.resolveItemFieldPath(field)).toBe('id');
  });
});

describe('schemaUtils.isPrimitiveArray', () => {
  it('returns true for an array of strings', () => {
    expect(schemaUtils.isPrimitiveArray(['INBOX', 'UNREAD'])).toBe(true);
  });

  it('returns true for an array of numbers', () => {
    expect(schemaUtils.isPrimitiveArray([1, 2, 3])).toBe(true);
  });

  it('returns true for an array of booleans', () => {
    expect(schemaUtils.isPrimitiveArray([true, false])).toBe(true);
  });

  it('treats null entries as primitive', () => {
    expect(schemaUtils.isPrimitiveArray(['a', null])).toBe(true);
  });

  it('returns true for an empty array', () => {
    expect(schemaUtils.isPrimitiveArray([])).toBe(true);
  });

  it('returns false for an array containing an object', () => {
    expect(schemaUtils.isPrimitiveArray([{ id: 1 }])).toBe(false);
  });

  it('returns false for an array containing a nested array', () => {
    expect(schemaUtils.isPrimitiveArray([['a']])).toBe(false);
  });

  it('returns false for non-array inputs', () => {
    expect(schemaUtils.isPrimitiveArray('hello')).toBe(false);
    expect(schemaUtils.isPrimitiveArray(null)).toBe(false);
    expect(schemaUtils.isPrimitiveArray({ length: 0 })).toBe(false);
  });
});
