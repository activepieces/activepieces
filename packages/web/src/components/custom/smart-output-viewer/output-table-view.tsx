import { isNil, isObject } from '@activepieces/shared';
import { t } from 'i18next';

import { stringUtils } from '@/lib/string-utils';
import { cn } from '@/lib/utils';

import { schemaUtils } from './resolve-schema';
import { OutputSchema } from './types';

const MAX_TABLE_ROWS = 100;

function isFlat(value: unknown): boolean {
  return value === null || typeof value !== 'object';
}

function isFlatObject(value: unknown): boolean {
  if (!isObject(value)) return false;
  return Object.values(value).every(isFlat);
}

function buildColumns(first: Record<string, unknown>): Column[] | null {
  const columns: Column[] = [];

  for (const [key, value] of Object.entries(first)) {
    if (isFlat(value)) {
      columns.push({
        key,
        label: stringUtils.titleCase(key),
        path: [key],
      });
    } else if (isObject(value) && isFlatObject(value)) {
      for (const nestedKey of Object.keys(value)) {
        columns.push({
          key: `${key}.${nestedKey}`,
          label: nestedKey,
          path: [key, nestedKey],
        });
      }
    } else {
      return null;
    }
  }

  return columns.length > 0 ? columns : null;
}

function isTabularArray(items: unknown[]): boolean {
  // A table compares multiple records side by side; a single row is not tabular
  // (it reads better as the object's own fields), so require at least two rows.
  if (items.length < 2) return false;

  const first = items[0];
  if (!isObject(first)) return false;

  const columns = buildColumns(first);
  if (!columns) return false;

  const firstKeys = Object.keys(first).sort().join(',');
  const sampleSize = Math.min(items.length, MAX_TABLE_ROWS);
  for (let i = 1; i < sampleSize; i++) {
    const item = items[i];
    if (!isObject(item)) return false;
    if (Object.keys(item).sort().join(',') !== firstKeys) return false;
  }

  return true;
}

function getCellValue(row: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = row;
  for (const segment of path) {
    if (!isObject(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return (
      <span className="text-muted-foreground/40 italic">{t('empty')}</span>
    );
  }

  return (
    <span className="break-words whitespace-pre-wrap">{String(value)}</span>
  );
}

function OutputTableView({ items }: OutputTableViewProps) {
  if (items.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        {t('empty')}
      </div>
    );
  }

  const firstRow = items[0];
  if (!isObject(firstRow)) return null;
  const columns = buildColumns(firstRow);
  if (!columns) return null;

  const allRows: Record<string, unknown>[] = items.filter(isObject);
  const totalRows = allRows.length;
  const rows = allRows.slice(0, MAX_TABLE_ROWS);
  const isTruncated = totalRows > MAX_TABLE_ROWS;

  return (
    <div className="p-3">
      <div className="text-xs text-muted-foreground mb-2">
        {isTruncated
          ? t('Showing {shown} of {total} {label}', {
              shown: rows.length,
              total: totalRows,
              label: t('rows'),
            })
          : t('rowCount', { count: totalRows })}{' '}
        × {t('columnCount', { count: columns.length })}
      </div>
      <div className="overflow-x-auto rounded-md border border-dividers">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-dividers">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={cn(
                  'border-b border-dividers last:border-b-0 hover:bg-accent/30 transition-colors',
                )}
              >
                {columns.map((col) => {
                  const cellValue = getCellValue(row, col.path);
                  return (
                    <td key={col.key} className="px-3 py-2">
                      <CellValue value={cellValue} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Maps a top-level array schema to the schema for a SINGLE item. A "wrapper"
// schema (single value:'' field naming the whole array) describes each item via
// its listItems, so return those — passing the wrapper unchanged would resolve
// value:'' against an item object and drop the listItems entirely. Returns null
// when there is no usable per-item schema (no schema, or an empty wrapper).
function toPerItemSchema(
  schema: OutputSchema | null | undefined,
): OutputSchema | null {
  if (isNil(schema)) return null;
  if (schemaUtils.isWholeOutputSchema(schema)) {
    const listItems = schema.fields[0]?.listItems ?? [];
    if (listItems.length === 0) return null;
    return { fields: listItems, itemLabel: schema.itemLabel };
  }
  return schema;
}

// Chooses the friendly renderer for a top-level array, and the schema to apply.
// A single-item array reads best as just its element — render the lone object's
// fields directly (no table, no "Item N" wrapper). A flat, uniform array of two
// or more rows reads best as a table, preferred even when a schema exists
// (curated schemas describe nested structure, which is never tabular). Otherwise
// fall back to the per-item schema list, or the schemaless list.
function selectArrayFriendlyView({
  items,
  schema,
}: {
  items: unknown[];
  schema?: OutputSchema | null;
}): ArrayFriendlyView {
  const first = items[0];
  if (items.length === 1 && isObject(first)) {
    const schemaForItem = toPerItemSchema(schema);
    return schemaForItem
      ? { kind: 'object', item: first, schema: schemaForItem }
      : { kind: 'object', item: first };
  }
  if (isTabularArray(items)) {
    return { kind: 'table' };
  }
  const perItemSchema = toPerItemSchema(schema);
  return perItemSchema
    ? { kind: 'schema', schema: perItemSchema }
    : { kind: 'list' };
}

export {
  OutputTableView,
  isTabularArray,
  buildColumns,
  selectArrayFriendlyView,
};

type ArrayFriendlyView =
  | { kind: 'object'; item: Record<string, unknown>; schema?: OutputSchema }
  | { kind: 'table' }
  | { kind: 'schema'; schema: OutputSchema }
  | { kind: 'list' };

type Column = {
  key: string;
  label: string;
  path: string[];
};

type OutputTableViewProps = {
  items: unknown[];
};
