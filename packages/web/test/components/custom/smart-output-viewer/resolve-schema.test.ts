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

describe('schemaUtils.resolveEntryLabel', () => {
  it('returns the fallback when no labelKey is given', () => {
    expect(
      schemaUtils.resolveEntryLabel({
        value: { name: 'Roadmap' },
        labelKey: undefined,
        fallback: 'uuid-1',
      }),
    ).toBe('uuid-1');
  });

  it('resolves the labelKey value from the entry', () => {
    expect(
      schemaUtils.resolveEntryLabel({
        value: { name: 'Roadmap', id: 'uuid-1' },
        labelKey: 'name',
        fallback: 'uuid-1',
      }),
    ).toBe('Roadmap');
  });

  it('resolves a nested dot-path labelKey', () => {
    expect(
      schemaUtils.resolveEntryLabel({
        value: { profile: { fullName: 'Ada Lovelace' } },
        labelKey: 'profile.fullName',
        fallback: 'Item 1',
      }),
    ).toBe('Ada Lovelace');
  });

  it('stringifies non-string primitive label values', () => {
    expect(
      schemaUtils.resolveEntryLabel({
        value: { count: 42 },
        labelKey: 'count',
        fallback: 'Item 1',
      }),
    ).toBe('42');
  });

  it('falls back when the labelKey value is missing', () => {
    expect(
      schemaUtils.resolveEntryLabel({
        value: { id: 'uuid-1' },
        labelKey: 'name',
        fallback: 'uuid-1',
      }),
    ).toBe('uuid-1');
  });

  it('falls back when the labelKey value is an empty string', () => {
    expect(
      schemaUtils.resolveEntryLabel({
        value: { name: '' },
        labelKey: 'name',
        fallback: 'Item 1',
      }),
    ).toBe('Item 1');
  });

  it('falls back when the labelKey value is an object', () => {
    expect(
      schemaUtils.resolveEntryLabel({
        value: { name: { nested: true } },
        labelKey: 'name',
        fallback: 'Item 1',
      }),
    ).toBe('Item 1');
  });

  it('falls back when the entry itself is not an object', () => {
    expect(
      schemaUtils.resolveEntryLabel({
        value: 'plain',
        labelKey: 'name',
        fallback: 'Item 1',
      }),
    ).toBe('Item 1');
  });
});

describe('schemaUtils.resolveTemplateLabel', () => {
  it('replaces multiple placeholders resolved against the item', () => {
    expect(
      schemaUtils.resolveTemplateLabel({
        value: { key: 'ADS-69', fields: { summary: 'Booking issue' } },
        template: '{key}: {fields.summary}',
        fallback: 'Item 1',
      }),
    ).toBe('ADS-69: Booking issue');
  });

  it('renders missing placeholders as empty but keeps resolved ones', () => {
    expect(
      schemaUtils.resolveTemplateLabel({
        value: { key: 'ADS-66' },
        template: '{key}: {fields.summary}',
        fallback: 'Item 1',
      }),
    ).toBe('ADS-66: ');
  });

  it('falls back when the template resolves to a blank string', () => {
    expect(
      schemaUtils.resolveTemplateLabel({
        value: {},
        template: '{key}',
        fallback: 'Item 1',
      }),
    ).toBe('Item 1');
  });

  it('ignores object-valued placeholders', () => {
    expect(
      schemaUtils.resolveTemplateLabel({
        value: { key: 'ADS-1', fields: { nested: { x: 1 } } },
        template: '{key} {fields.nested}',
        fallback: 'Item 1',
      }),
    ).toBe('ADS-1 ');
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
