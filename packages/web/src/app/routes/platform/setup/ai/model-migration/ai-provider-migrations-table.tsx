import {
  FlowAiProviderMigration,
  FlowAiProviderMigrationStatus,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Clock,
  Eye,
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
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useAiProviderMigrations } from './ai-provider-migrations-hooks';
import { FailedMigrationsDialog } from './failed-migrations-dialog';

export function AiProviderMigrationsTable({
  onMigrateClick,
  showMigrateButton,
}: AiProviderMigrationsTableProps) {
  const { data, isLoading } = useAiProviderMigrations({ limit: 10 });
  const [failedMigration, setFailedMigration] =
    useState<FlowAiProviderMigration | null>(null);

  const columns: ColumnDef<
    RowDataWithActions<FlowAiProviderMigration>,
    unknown
  >[] = [
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
          <span>
            {row.original.sourceModel.provider}/{row.original.sourceModel.model}
          </span>
          <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
          <span>
            {row.original.targetModel.provider}/{row.original.targetModel.model}
          </span>
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
        const { totalVersions, processedVersions, failedFlowVersions } =
          row.original;
        const total = processedVersions + failedFlowVersions.length;
        const progress =
          totalVersions > 0 ? Math.round((total / totalVersions) * 100) : 0;
        return (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <Progress value={progress} className="h-1.5" />
            <span className="text-xs text-muted-foreground">
              {processedVersions} / {totalVersions}
              {failedFlowVersions.length > 0 &&
                ` (${failedFlowVersions.length} ${t('failed')})`}
            </span>
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="" />
      ),
      cell: ({ row }) => {
        const failedCount = row.original.failedFlowVersions.length;
        if (failedCount === 0) return null;
        return (
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  onClick={() => setFailedMigration(row.original)}
                >
                  <Eye className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('View failures')}
              </TooltipContent>
            </Tooltip>
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
                <Button
                  key="migrate"
                  variant="outline"
                  size="sm"
                  onClick={onMigrateClick}
                >
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
    </>
  );
}

function StatusBadge({
  status,
  failedCount,
}: {
  status: FlowAiProviderMigrationStatus;
  failedCount: number;
}) {
  switch (status) {
    case FlowAiProviderMigrationStatus.RUNNING:
      return (
        <Badge variant="default">
          <Loader2 className="size-3 animate-spin mr-1" />
          {t('Running')}
        </Badge>
      );
    case FlowAiProviderMigrationStatus.COMPLETED:
      if (failedCount > 0) {
        return (
          <Badge variant="destructive">
            <AlertTriangle className="size-3 mr-1" />
            {t('Completed with errors')}
          </Badge>
        );
      }
      return <Badge variant="success">{t('Completed')}</Badge>;
    case FlowAiProviderMigrationStatus.FAILED:
      return <Badge variant="destructive">{t('Failed')}</Badge>;
  }
}

type AiProviderMigrationsTableProps = {
  onMigrateClick: () => void;
  showMigrateButton: boolean;
};
