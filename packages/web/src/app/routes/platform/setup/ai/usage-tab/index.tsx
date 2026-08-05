import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { ChartColumn, Info, Pencil } from 'lucide-react';
import { useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUtils } from '@/lib/format-utils';

import { MockProjectAiUsage, MockScenario } from '../mock/fixtures';

import { SetLimitDialog } from './set-limit-dialog';

export function UsageTab({ scenario }: { scenario: MockScenario }) {
  const [rows, setRows] = useState(scenario.usage);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const editingRow = rows.find((row) => row.projectId === editingProjectId);

  const columns: ColumnDef<RowDataWithActions<MockProjectAiUsage>>[] = [
    {
      accessorKey: 'projectName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Project')} />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.projectName}</span>
      ),
    },
    {
      accessorKey: 'creditsUsed',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('AI credits used')} />
      ),
      cell: ({ row }) => (
        <span className="flex items-center gap-2 text-sm tabular-nums">
          {row.original.creditsUsed.toLocaleString()}
          {row.original.isEstimate && (
            <span
              title={t(
                'Estimated for bring-your-own-key providers — the provider dashboard is the source of truth.',
              )}
              className="inline-flex"
            >
              <Badge variant="outline">{t('Estimate')}</Badge>
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'limit',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Limit')} />
      ),
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm tabular-nums">
          {row.original.limit === null
            ? t('No limit')
            : row.original.limit.toLocaleString()}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingProjectId(row.original.projectId)}
          >
            <Pencil className="size-3.5" />
          </Button>
        </span>
      ),
    },
    {
      id: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => <UsageStatusBadge row={row.original} />,
    },
    {
      accessorKey: 'lastActivity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last activity')} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatUtils.formatDate(new Date(row.original.lastActivity))}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          {t(
            'Numbers for bring-your-own-key providers are estimates. Open the provider’s usage dashboard from the Providers tab for exact spend.',
          )}
        </AlertDescription>
      </Alert>
      <DataTable
        columns={columns}
        page={{ data: rows, next: null, previous: null }}
        isLoading={false}
        hidePagination={true}
        emptyStateTextTitle={t('No AI usage yet')}
        emptyStateTextDescription={t(
          'Usage appears here as soon as a project runs chat, agents, or AI steps.',
        )}
        emptyStateIcon={
          <ChartColumn className="size-10 text-muted-foreground" />
        }
      />
      <SetLimitDialog
        open={editingRow !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProjectId(null);
          }
        }}
        projectName={editingRow?.projectName ?? ''}
        currentLimit={editingRow?.limit ?? null}
        onSave={(limit) => {
          setRows((current) =>
            current.map((row) =>
              row.projectId === editingProjectId ? { ...row, limit } : row,
            ),
          );
        }}
      />
    </div>
  );
}

function UsageStatusBadge({ row }: { row: MockProjectAiUsage }) {
  if (row.limit === null) {
    return <Badge variant="outline">{t('No limit')}</Badge>;
  }
  const ratio = row.creditsUsed / row.limit;
  if (ratio >= 1) {
    return <Badge variant="destructive">{t('Limit reached')}</Badge>;
  }
  if (ratio >= 0.8) {
    return <Badge variant="accent">{t('Approaching limit')}</Badge>;
  }
  return <Badge variant="success">{t('On track')}</Badge>;
}
