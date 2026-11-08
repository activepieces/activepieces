import { t } from 'i18next';
import { ArrowDown, ArrowUp, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { SearchInput } from '@/components/custom/search-input';
import { cn } from '@/lib/utils';

import {
  buildDownloadAction,
  PreviewCard,
  useCopyAction,
} from './preview-card';
import { previewUtils, SortDirection, TableData } from './preview-utils';

export function SpreadsheetPreview({
  table,
  label,
  fileName = 'data',
}: {
  table: TableData;
  label?: string;
  fileName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<TableSort | null>(null);

  const numeric = useMemo(() => previewUtils.numericColumns(table), [table]);
  const expandedRows = useMemo(() => {
    const filtered = previewUtils.filterRows({ rows: table.rows, query });
    return sort
      ? previewUtils.sortRows({
          rows: filtered,
          column: sort.column,
          direction: sort.direction,
          numeric: numeric[sort.column] ?? false,
        })
      : filtered;
  }, [table, query, sort, numeric]);

  const copyAction = useCopyAction(previewUtils.buildTsv(table));
  const downloadAction = buildDownloadAction({
    fileName,
    content: previewUtils.buildCsv(table),
    mimeType: 'text/csv',
    extension: 'csv',
  });

  const totalRows = table.rows.length;
  const inlineRows = table.rows.slice(0, INLINE_MAX_ROWS);
  const truncated = totalRows > INLINE_MAX_ROWS;
  const hasHiddenColumns = table.headers.length > NARROW_VISIBLE_COLUMNS;
  const sizeMeta = t(
    '{rows, plural, =1 {1 row} other {# rows}} · {columns, plural, =1 {1 column} other {# columns}}',
    { rows: totalRows, columns: table.headers.length },
  );
  const shownRows = expandedRows.slice(0, EXPANDED_MAX_ROWS);

  const toggleSort = (column: number) => {
    setSort((current) =>
      current?.column === column && current.direction === 'asc'
        ? { column, direction: 'desc' }
        : { column, direction: 'asc' },
    );
  };

  return (
    <PreviewCard
      icon={Table2}
      label={label ?? t('Table')}
      meta={sizeMeta}
      actions={[copyAction, downloadAction]}
      expanded={expanded}
      onExpandedChange={setExpanded}
      expandedSwitcher={
        <div className="w-56 @max-chat-narrow/chat:w-40">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t('Search rows')}
            className="h-8"
          />
        </div>
      }
      renderExpanded={() => (
        <>
          <SpreadsheetTable
            headers={table.headers}
            rows={shownRows}
            numeric={numeric}
            sort={sort}
            onSort={toggleSort}
            wrapCells
          />
          {expandedRows.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-11">
              {t('No rows match your search.')}
            </p>
          )}
          {expandedRows.length > shownRows.length && (
            <p className="border-t border-gray-6 px-4 py-2 text-xs text-gray-11">
              {t('{shown} of {total} rows', {
                shown: shownRows.length,
                total: expandedRows.length,
              })}
            </p>
          )}
        </>
      )}
    >
      <SpreadsheetTable
        headers={table.headers}
        rows={inlineRows}
        numeric={numeric}
      />
      {(truncated || hasHiddenColumns) && (
        <div
          className={cn(
            'flex items-center gap-3 border-t border-gray-6 px-4 py-2 text-sm',
            !truncated && 'hidden @max-chat-narrow/chat:flex',
            '@max-chat-narrow/chat:justify-between @max-chat-narrow/chat:px-3',
          )}
        >
          <span
            data-testid="table-narrow-footer"
            className="hidden min-w-0 truncate text-xs text-gray-11 @max-chat-narrow/chat:inline"
          >
            {hasHiddenColumns
              ? t('{shown} of {total} rows · scroll for more columns', {
                  shown: inlineRows.length,
                  total: totalRows,
                })
              : t('{shown} of {total} rows', {
                  shown: inlineRows.length,
                  total: totalRows,
                })}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="shrink-0 rounded-sm font-medium text-accent-11 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-gray-8"
          >
            {t(
              '{count, plural, =1 {Open full table · 1 row} other {Open full table · # rows}}',
              { count: totalRows },
            )}
          </button>
        </div>
      )}
    </PreviewCard>
  );
}

function SpreadsheetTable({
  headers,
  rows,
  numeric,
  sort,
  onSort,
  wrapCells = false,
}: SpreadsheetTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-2">
            {headers.map((header, column) => (
              <th
                key={column}
                aria-sort={ariaSort({ sort, column })}
                className={cn(
                  'whitespace-nowrap bg-gray-2 px-4 py-2 text-xs font-medium text-gray-11 @max-chat-narrow/chat:px-3',
                  numeric[column] ? 'text-right' : 'text-left',
                )}
              >
                {onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(column)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-sm outline-none hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-gray-8',
                      sort?.column === column && 'text-gray-12',
                    )}
                  >
                    {header}
                    {sort?.column === column &&
                      (sort.direction === 'asc' ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      ))}
                  </button>
                ) : (
                  header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-t border-gray-4">
              {row.map((cell, column) => (
                <td
                  key={column}
                  title={wrapCells ? undefined : cell}
                  className={cn(
                    'px-4 py-2 align-top text-gray-12 @max-chat-narrow/chat:px-3',
                    numeric[column] && 'text-right tabular-nums',
                    wrapCells
                      ? 'whitespace-pre-wrap break-words'
                      : 'max-w-xs truncate whitespace-nowrap',
                  )}
                >
                  {cell === '' ? (
                    <span className="text-gray-9">{t('empty')}</span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ariaSort({
  sort,
  column,
}: {
  sort?: TableSort | null;
  column: number;
}): 'ascending' | 'descending' | undefined {
  if (sort?.column !== column) return undefined;
  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

const INLINE_MAX_ROWS = 5;
const EXPANDED_MAX_ROWS = 5000;
const NARROW_VISIBLE_COLUMNS = 2;

type TableSort = {
  column: number;
  direction: SortDirection;
};

type SpreadsheetTableProps = {
  headers: string[];
  rows: string[][];
  numeric: boolean[];
  sort?: TableSort | null;
  onSort?: (column: number) => void;
  wrapCells?: boolean;
};
