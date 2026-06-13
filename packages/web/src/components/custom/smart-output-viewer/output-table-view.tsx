import { isObject } from '@activepieces/shared';
import { t } from 'i18next';

import { stringUtils } from '@/lib/string-utils';
import { cn } from '@/lib/utils';

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
  if (items.length === 0) return false;

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

// Chooses the friendly renderer for a top-level array. A flat, uniform array
// reads best as a table — prefer it even when a schema exists (curated schemas
// describe nested structure, which is never tabular, so they fall through).
function selectArrayFriendlyView({
  items,
  hasSchema,
}: {
  items: unknown[];
  hasSchema: boolean;
}): 'table' | 'schema' | 'list' {
  if (isTabularArray(items)) return 'table';
  return hasSchema ? 'schema' : 'list';
}

export {
  OutputTableView,
  isTabularArray,
  buildColumns,
  selectArrayFriendlyView,
};

type Column = {
  key: string;
  label: string;
  path: string[];
};

type OutputTableViewProps = {
  items: unknown[];
};
