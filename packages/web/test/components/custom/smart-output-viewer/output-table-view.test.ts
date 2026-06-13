import { describe, it, expect } from 'vitest';

import {
  buildColumns,
  isTabularArray,
  selectArrayFriendlyView,
} from '@/components/custom/smart-output-viewer/output-table-view';

describe('isTabularArray', () => {
  it('returns false for an empty array', () => {
    expect(isTabularArray([])).toBe(false);
  });

  it('returns false when the first item is not a record', () => {
    expect(isTabularArray(['a', 'b'])).toBe(false);
    expect(isTabularArray([1, 2, 3])).toBe(false);
    expect(isTabularArray([null, null])).toBe(false);
    expect(isTabularArray([[1, 2]])).toBe(false);
  });

  it('returns true for a homogeneous array of flat records', () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ];
    expect(isTabularArray(items)).toBe(true);
  });

  it('returns false for heterogeneous record shapes', () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, label: 'b' },
    ];
    expect(isTabularArray(items)).toBe(false);
  });

  it('accepts records whose values are themselves flat records (one level of nesting)', () => {
    const items = [
      { id: 1, address: { city: 'London', zip: 'EC1' } },
      { id: 2, address: { city: 'Paris', zip: '75000' } },
    ];
    expect(isTabularArray(items)).toBe(true);
  });

  it('rejects records with deeply nested non-flat values', () => {
    const items = [
      { id: 1, payload: { user: { name: 'a' } } },
      { id: 2, payload: { user: { name: 'b' } } },
    ];
    expect(isTabularArray(items)).toBe(false);
  });

  it('detects shape divergence past the first five rows', () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
      { id: 5, name: 'e' },
      { id: 6, label: 'f' },
    ];
    expect(isTabularArray(items)).toBe(false);
  });
});

describe('buildColumns', () => {
  it('builds columns for flat records', () => {
    const cols = buildColumns({ id: 1, name: 'a' });
    expect(cols).toEqual([
      { key: 'id', label: 'Id', path: ['id'] },
      { key: 'name', label: 'Name', path: ['name'] },
    ]);
  });

  it('flattens one level of nested flat records', () => {
    const cols = buildColumns({
      id: 1,
      address: { city: 'London', zip: 'EC1' },
    });
    expect(cols).toEqual([
      { key: 'id', label: 'Id', path: ['id'] },
      { key: 'address.city', label: 'city', path: ['address', 'city'] },
      { key: 'address.zip', label: 'zip', path: ['address', 'zip'] },
    ]);
  });

  it('returns null when a value is not flat or flat-object', () => {
    expect(buildColumns({ id: 1, items: [1, 2, 3] })).toBeNull();
  });

  it('humanises camelCase and snake_case keys', () => {
    const cols = buildColumns({ firstName: 'a', last_name: 'b' });
    expect(cols?.[0].label).toBe('First Name');
    expect(cols?.[1].label).toBe('Last Name');
  });

  it('returns null for an empty object', () => {
    expect(buildColumns({})).toBeNull();
  });
});

describe('selectArrayFriendlyView', () => {
  it('chooses table for a flat tabular array even when a schema exists (find_rows)', () => {
    const findRows = [
      { row: 2, values: { Name: 'Alice', Email: 'alice@acme.com' } },
      { row: 3, values: { Name: 'Bob', Email: 'bob@acme.com' } },
    ];
    expect(selectArrayFriendlyView({ items: findRows, hasSchema: true })).toBe(
      'table',
    );
    expect(selectArrayFriendlyView({ items: findRows, hasSchema: false })).toBe(
      'table',
    );
  });

  it('uses the schema renderer for a non-tabular array with a schema', () => {
    const issues = [
      { key: 'ADS-1', fields: { summary: 'x', status: { name: 'To Do' } } },
    ];
    expect(selectArrayFriendlyView({ items: issues, hasSchema: true })).toBe(
      'schema',
    );
  });

  it('falls back to the schemaless list for a non-tabular array with no schema', () => {
    const issues = [{ key: 'ADS-1', fields: { status: { name: 'To Do' } } }];
    expect(selectArrayFriendlyView({ items: issues, hasSchema: false })).toBe(
      'list',
    );
  });
});
