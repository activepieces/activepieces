import { FlowMigration, FlowMigrationStatus } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  Layers,
  ListChecks,
  Loader2,
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

import { useAiProviderMigrations } from './ai-provider-migrations-hooks';
import { FailedMigrationsDialog } from './failed-migrations-dialog';
import { MigratedFlowsDialog } from './migrated-flows-dialog';

export function AiProviderMigrationsTable({
  onMigrateClick,
  showMigrateButton,
}: AiProviderMigrationsTableProps) {
  const { data, isLoading } = useAiProviderMigrations({ limit: 10 });
  const [failedMigration, setFailedMigration] = useState<FlowMigration | null>(
    null,
  );
  const [migratedMigration, setMigratedMigration] =
    useState<FlowMigration | null>(null);

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
      size: 100,
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          failedCount={row.original.failedFlowVersions.length}
        />
      ),
    },
    {
      accessorKey: 'progress',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Progress')} />
      ),
      cell: ({ row }) => {
        const { migratedVersions, failedFlowVersions } = row.original;
        const migratedFlowCount = new Set(migratedVersions.map((v) => v.flowId))
          .size;
        const failedFlowCount = new Set(failedFlowVersions.map((v) => v.flowId))
          .size;
        return (
          <div
            className="flex flex-col gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {migratedFlowCount > 0 ? (
              <button
                className="text-sm text-primary hover:underline cursor-pointer text-left"
                onClick={() => setMigratedMigration(row.original)}
              >
                {migratedFlowCount} {t('migrated')}
              </button>
            ) : (
              <span className="text-sm text-muted-foreground">
                {migratedFlowCount} {t('migrated')}
              </span>
            )}
            {failedFlowCount > 0 && (
              <button
                className="text-sm text-destructive hover:underline cursor-pointer text-left"
                onClick={() => setFailedMigration(row.original)}
              >
                {failedFlowCount} {t('failed')}
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
      {failedMigration && (
        <FailedMigrationsDialog
          open={!!failedMigration}
          onOpenChange={(open: boolean) => {
            if (!open) setFailedMigration(null);
          }}
          failedFlowVersions={failedMigration.failedFlowVersions}
        />
      )}
      {migratedMigration && (
        <MigratedFlowsDialog
          open={!!migratedMigration}
          onOpenChange={(open: boolean) => {
            if (!open) setMigratedMigration(null);
          }}
          migratedVersions={migratedMigration.migratedVersions}
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

type AiProviderMigrationsTableProps = {
  onMigrateClick: () => void;
  showMigrateButton: boolean;
};
