import { describe, it, expect } from 'vitest';

import {
  buildColumns,
  isTabularArray,
  selectArrayFriendlyView,
} from '@/components/custom/smart-output-viewer/output-table-view';
import type { OutputSchema } from '@/components/custom/smart-output-viewer/types';

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

  it('returns false for a single-item array (a table needs at least two rows)', () => {
    expect(isTabularArray([{ id: 1, name: 'a' }])).toBe(false);
    expect(isTabularArray([{ Think: null, Content: 'Hello!' }])).toBe(false);
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
  it('chooses table for a flat tabular array even when a (wrapper) schema exists', () => {
    const findRows = [
      { row: 2, values: { Name: 'Alice', Email: 'alice@acme.com' } },
      { row: 3, values: { Name: 'Bob', Email: 'bob@acme.com' } },
    ];
    const wrapper: OutputSchema = {
      fields: [
        {
          key: 'rows',
          label: 'Found Rows',
          value: '',
          listItems: [{ key: 'row' }],
        },
      ],
    };
    expect(
      selectArrayFriendlyView({ items: findRows, schema: wrapper }).kind,
    ).toBe('table');
    expect(
      selectArrayFriendlyView({ items: findRows, schema: null }).kind,
    ).toBe('table');
  });

  it('unwraps a single-item flat array to the lone object (Groq-style AI response)', () => {
    const single = [
      { Think: null, Content: 'Hello! How can I help you today?' },
    ];
    const noSchema = selectArrayFriendlyView({ items: single, schema: null });
    expect(noSchema.kind).toBe('object');
    expect(noSchema.kind === 'object' && noSchema.item).toEqual(single[0]);
    expect(noSchema.kind === 'object' && noSchema.schema).toBeUndefined();

    const perItem: OutputSchema = {
      fields: [{ key: 'Content' }, { key: 'Think' }],
    };
    const withSchema = selectArrayFriendlyView({
      items: single,
      schema: perItem,
    });
    expect(withSchema.kind).toBe('object');
    expect(withSchema.kind === 'object' && withSchema.schema).toBe(perItem);
  });

  it('unwraps a single-item array under a wrapper schema using its listItems', () => {
    const single = [{ row: 2, name: 'Ada' }];
    const wrapper: OutputSchema = {
      itemLabel: 'Row {row}',
      fields: [
        { key: 'rows', value: '', listItems: [{ key: 'row' }, { key: 'name' }] },
      ],
    };
    const view = selectArrayFriendlyView({ items: single, schema: wrapper });
    expect(view.kind).toBe('object');
    if (view.kind === 'object') {
      // the wrapper's listItems become the lone item's fields, not value:''
      expect(view.schema?.fields).toHaveLength(2);
      expect(view.schema?.fields[0]?.key).toBe('row');
    }
  });

  it('does not unwrap a single-item array whose item is not an object', () => {
    expect(selectArrayFriendlyView({ items: ['hi'], schema: null }).kind).toBe(
      'list',
    );
    expect(selectArrayFriendlyView({ items: [[1, 2]], schema: null }).kind).toBe(
      'list',
    );
  });

  it('passes a per-item schema through unchanged for a non-tabular array', () => {
    const issues = [
      { key: 'ADS-1', fields: { summary: 'x', status: { name: 'To Do' } } },
      { key: 'ADS-2', fields: { summary: 'y', status: { name: 'Done' } } },
    ];
    const schema: OutputSchema = {
      fields: [{ key: 'key' }, { key: 'summary', value: 'fields.summary' }],
    };
    const view = selectArrayFriendlyView({ items: issues, schema });
    expect(view.kind).toBe('schema');
    expect(view.kind === 'schema' && view.schema).toBe(schema);
  });

  it('falls back to the schemaless list for a non-tabular array with no schema', () => {
    const issues = [
      { key: 'ADS-1', fields: { status: { name: 'To Do' } } },
      { key: 'ADS-2', fields: { status: { name: 'Done' } } },
    ];
    expect(selectArrayFriendlyView({ items: issues, schema: null }).kind).toBe(
      'list',
    );
  });

  it('rebuilds a per-item schema from a non-tabular wrapper schema (its listItems)', () => {
    const items = [
      { row: 2, details: { profile: { name: 'Ada' } } },
      { row: 3, details: { profile: { name: 'Bob' } } },
    ];
    const wrapper: OutputSchema = {
      itemLabel: 'Row {row}',
      fields: [
        {
          key: 'rows',
          label: 'Found Rows',
          value: '',
          listItems: [
            { key: 'row', label: 'Row Number', value: 'row' },
            { key: 'name', label: 'Name', value: 'details.profile.name' },
          ],
        },
      ],
    };
    const view = selectArrayFriendlyView({ items, schema: wrapper });
    expect(view.kind).toBe('schema');
    if (view.kind === 'schema') {
      // the wrapper's listItems become the per-item fields, NOT the value:'' wrapper
      expect(view.schema.fields).toHaveLength(2);
      expect(view.schema.fields[0]?.key).toBe('row');
      expect(view.schema.itemLabel).toBe('Row {row}');
    }
  });

  it('falls back to list for a wrapper schema with no listItems', () => {
    // deeply nested → not tabular, so it reaches the wrapper branch
    const items = [{ a: { deep: { x: 1 } } }, { a: { deep: { y: 2 } } }];
    const wrapper: OutputSchema = { fields: [{ key: 'rows', value: '' }] };
    expect(selectArrayFriendlyView({ items, schema: wrapper }).kind).toBe(
      'list',
    );
  });
});
