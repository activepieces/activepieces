import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_CELL_LENGTH = 50;

type Column = {
  key: string;
  label: string;
  path: string[];
};

function formatColumnName(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isFlat(value: unknown): boolean {
  return isNil(value) || typeof value !== 'object';
}

function isFlatObject(value: unknown): boolean {
  if (isNil(value) || typeof value !== 'object' || Array.isArray(value))
    return false;
  return Object.values(value as Record<string, unknown>).every(isFlat);
}

function buildColumns(first: Record<string, unknown>): Column[] | null {
  const columns: Column[] = [];

  for (const [key, value] of Object.entries(first)) {
    if (isFlat(value)) {
      columns.push({
        key,
        label: formatColumnName(key),
        path: [key],
      });
    } else if (isFlatObject(value)) {
      for (const nestedKey of Object.keys(value as Record<string, unknown>)) {
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
  if (isNil(first) || typeof first !== 'object' || Array.isArray(first))
    return false;

  const columns = buildColumns(first as Record<string, unknown>);
  if (!columns) return false;

  const firstKeys = Object.keys(first as Record<string, unknown>).sort();
  const sampleSize = Math.min(items.length, 5);
  for (let i = 1; i < sampleSize; i++) {
    const item = items[i];
    if (isNil(item) || typeof item !== 'object' || Array.isArray(item))
      return false;
    const keys = Object.keys(item as Record<string, unknown>).sort();
    if (keys.join(',') !== firstKeys.join(',')) return false;
  }

  return true;
}

function getCellValue(row: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = row;
  for (const segment of path) {
    if (isNil(current) || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function CellValue({ value }: { value: unknown }) {
  if (isNil(value) || value === '') {
    return (
      <span className="text-muted-foreground/40 italic">{t('empty')}</span>
    );
  }

  const str = String(value);
  const isTruncated = str.length > MAX_CELL_LENGTH;
  const displayText = isTruncated ? str.slice(0, MAX_CELL_LENGTH) + '...' : str;

  return (
    <span title={isTruncated ? str : undefined} className="break-words">
      {displayText}
    </span>
  );
}

type OutputTableViewProps = {
  items: unknown[];
};

function OutputTableView({ items }: OutputTableViewProps) {
  if (items.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        {t('empty')}
      </div>
    );
  }

  const columns = buildColumns(items[0] as Record<string, unknown>);
  if (!columns) return null;

  const rows = items as Record<string, unknown>[];

  return (
    <div className="p-3">
      <div className="text-xs text-muted-foreground mb-2">
        {rows.length} {t('rows')} × {columns.length} {t('columns')}
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
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 group relative">
                    <div className="flex items-center gap-1">
                      <CellValue value={getCellValue(row, col.path)} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 shrink-0 h-5 w-5 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            String(getCellValue(row, col.path) ?? ''),
                          );
                          toast.success(t('Copied'), { duration: 1000 });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { OutputTableView, isTabularArray };
