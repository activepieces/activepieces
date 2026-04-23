import { FlowMigration, FlowMigrationStatus } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  FlaskConical,
  Layers,
  ListChecks,
  Loader2,
  Play,
} from 'lucide-react';
import { useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useAiProviderMigrations } from '../hooks/ai-provider-migration-hooks';

import { FailedMigrationsDialog } from './failed-migrations-dialog';
import { MigratedFlowsDialog } from './migrated-flows-dialog';

export function AiProviderMigrationsTable({
  onMigrateClick,
  onRunForReal,
  showMigrateButton,
}: AiProviderMigrationsTableProps) {
  const { data, isLoading } = useAiProviderMigrations({ limit: 10 });
  const [rowDialog, setRowDialog] = useState<RowDialog | null>(null);

  const columns: ColumnDef<RowDataWithActions<FlowMigration>, unknown>[] = [
    {
      accessorKey: 'models',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Models')}
          icon={Layers}
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm">
                <span>{row.original.params.sourceModel.model}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span>{row.original.params.targetModel.model}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              {row.original.params.sourceModel.provider}/
              {row.original.params.sourceModel.model} →{' '}
              {row.original.params.targetModel.provider}/
              {row.original.params.targetModel.model}
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Status')}
          icon={ListChecks}
        />
      ),
      size: 140,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge
            status={row.original.status}
            failedCount={row.original.failedFlowVersions.length}
          />
          {row.original.params.dryCheck && (
            <Badge variant="secondary">
              <FlaskConical className="size-3 mr-1" />
              {t('Dry-check')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'progress',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Progress')} />
      ),
      cell: ({ row }) => {
        const { migratedVersions, failedFlowVersions, params } = row.original;
        const migratedFlowCount = new Set(migratedVersions.map((v) => v.flowId))
          .size;
        const failedFlowCount = new Set(failedFlowVersions.map((v) => v.flowId))
          .size;
        const migratedLabel = params.dryCheck ? t('planned') : t('migrated');
        const failedLabel = params.dryCheck ? t('blocked') : t('failed');
        return (
          <div
            className="flex flex-col gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {migratedFlowCount > 0 ? (
              <button
                className="text-sm text-primary hover:underline cursor-pointer text-left"
                onClick={() =>
                  setRowDialog({ kind: 'migrated', migration: row.original })
                }
              >
                {migratedFlowCount} {migratedLabel}
              </button>
            ) : (
              <span className="text-sm text-muted-foreground">
                {migratedFlowCount} {migratedLabel}
              </span>
            )}
            {failedFlowCount > 0 && (
              <button
                className="text-sm text-destructive hover:underline cursor-pointer text-left"
                onClick={() =>
                  setRowDialog({ kind: 'failed', migration: row.original })
                }
              >
                {failedFlowCount} {failedLabel}
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Date')} icon={Clock} />
      ),
      cell: ({ row }) => (
        <FormattedDate date={new Date(row.original.created)} />
      ),
    },
    {
      id: 'actions',
      header: () => null,
      size: 150,
      cell: ({ row }) => {
        if (
          !row.original.params.dryCheck ||
          row.original.status !== FlowMigrationStatus.COMPLETED
        ) {
          return null;
        }
        return (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRunForReal(row.original)}
            >
              <Play className="size-3 mr-1" />
              {t('Run for real')}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        emptyStateTextTitle={t('No migrations yet')}
        emptyStateTextDescription={t(
          'Migrate your AI models to update all flows at once.',
        )}
        emptyStateIcon={<ArrowLeftRight className="size-14" />}
        toolbarButtons={
          showMigrateButton
            ? [
                <Button key="migrate" size="sm" onClick={onMigrateClick}>
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  {t('Migrate Flows')}
                </Button>,
              ]
            : []
        }
      />
      {rowDialog?.kind === 'failed' && (
        <FailedMigrationsDialog
          open
          onOpenChange={(open: boolean) => {
            if (!open) setRowDialog(null);
          }}
          failedFlowVersions={rowDialog.migration.failedFlowVersions}
        />
      )}
      {rowDialog?.kind === 'migrated' && (
        <MigratedFlowsDialog
          open
          onOpenChange={(open: boolean) => {
            if (!open) setRowDialog(null);
          }}
          migratedVersions={rowDialog.migration.migratedVersions}
          isDryCheck={rowDialog.migration.params.dryCheck}
        />
      )}
    </>
  );
}

function StatusBadge({
  status,
  failedCount,
}: {
  status: FlowMigrationStatus;
  failedCount: number;
}) {
  switch (status) {
    case FlowMigrationStatus.RUNNING:
      return (
        <Badge variant="default">
          <Loader2 className="size-3 animate-spin mr-1" />
          {t('Running')}
        </Badge>
      );
    case FlowMigrationStatus.COMPLETED:
      if (failedCount > 0) {
        return <Badge variant="destructive">{t('Failed')}</Badge>;
      }
      return <Badge variant="success">{t('Completed')}</Badge>;
    case FlowMigrationStatus.FAILED:
      return <Badge variant="destructive">{t('Failed')}</Badge>;
  }
}

type RowDialog = {
  kind: 'failed' | 'migrated';
  migration: FlowMigration;
};

type AiProviderMigrationsTableProps = {
  onMigrateClick: () => void;
  onRunForReal: (dryCheckMigration: FlowMigration) => void;
  showMigrateButton: boolean;
};
