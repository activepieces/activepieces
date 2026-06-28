import { t } from 'i18next';
import { Table2 } from 'lucide-react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { DownloadButton } from '@/components/custom/download-button';
import { cn } from '@/lib/utils';

import { PreviewCard } from './preview-card';
import { previewUtils, TableData } from './preview-utils';

const INLINE_MAX_ROWS = 50;

function SpreadsheetTable({
  table,
  maxRows,
  className,
}: {
  table: TableData;
  maxRows: number;
  className?: string;
}) {
  const totalRows = table.rows.length;
  const rows = table.rows.slice(0, maxRows);
  const truncated = totalRows > maxRows;

  return (
    <div className={cn('overflow-auto', className)}>
      <table className="w-full table-fixed text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-muted">
            {table.headers.map((header, i) => (
              <th
                key={i}
                className="break-words bg-muted px-3 py-2 text-left align-top font-medium text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-border transition-colors last:border-b-0 hover:bg-accent/30"
            >
              {row.map((cell, colIdx) => (
                <td key={colIdx} className="px-3 py-2 align-top">
                  {cell === '' ? (
                    <span className="italic text-muted-foreground/40">
                      {t('empty')}
                    </span>
                  ) : (
                    <span className="whitespace-pre-wrap break-words">
                      {cell}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {truncated && (
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {t('Showing {shown} of {total} rows — expand to see all', {
            shown: rows.length,
            total: totalRows,
          })}
        </div>
      )}
    </div>
  );
}

export function SpreadsheetPreview({
  table,
  label,
  fileName = 'data',
}: {
  table: TableData;
  label?: string;
  fileName?: string;
}) {
  const headerLabel =
    label ??
    t('{rows} rows × {cols} columns', {
      rows: table.rows.length,
      cols: table.headers.length,
    });

  const actions = (
    <>
      <CopyButton
        textToCopy={previewUtils.buildTsv(table)}
        variant="ghost"
        className="size-8"
      />
      <DownloadButton
        fileName={fileName}
        textToDownload={previewUtils.buildCsv(table)}
        mimeType="text/csv"
        extension="csv"
        variant="ghost"
        className="size-8"
      />
    </>
  );

  return (
    <PreviewCard
      icon={Table2}
      label={headerLabel}
      actions={actions}
      renderExpanded={() => (
        <SpreadsheetTable table={table} maxRows={5000} className="h-full" />
      )}
    >
      <SpreadsheetTable
        table={table}
        maxRows={INLINE_MAX_ROWS}
        className="max-h-[360px]"
      />
    </PreviewCard>
  );
}
