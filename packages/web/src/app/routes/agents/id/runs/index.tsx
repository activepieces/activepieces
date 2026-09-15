import { AgentConversation } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { History } from 'lucide-react';
import { useMemo } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/custom/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { agentRunUtils } from '@/features/agents/lib/agent-run-utils';
import { projectCollectionUtils } from '@/features/projects';
import { formatUtils } from '@/lib/format-utils';

type AgentRunsProps = {
  agentId: string;
};

export const AgentRuns = ({ agentId }: AgentRunsProps) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const {
    data: runs,
    isLoading,
    isError,
    refetch,
  } = agentsQueries.useAgentRuns({ agentId, projectId: project.id });

  const columns: ColumnDef<RowDataWithActions<AgentConversation>>[] = useMemo(
    () => [
      {
        accessorKey: 'status',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Status')} />
        ),
        cell: ({ row }) => {
          const look = agentRunUtils.statusLook(row.original.status);
          return (
            <StatusIconWithText
              icon={look.icon}
              text={look.text}
              variant={look.variant}
            />
          );
        },
      },
      {
        accessorKey: 'created',
        size: 200,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Started')} />
        ),
        cell: ({ row }) => (
          <FormattedDate date={new Date(row.original.created)} includeTime />
        ),
      },
      {
        accessorKey: 'updated',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Duration')} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatUtils.formatDuration(
              agentRunUtils.durationMs(row.original),
              true,
            )}
          </span>
        ),
      },
      {
        accessorKey: 'modelName',
        size: 220,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Model')} />
        ),
        cell: ({ row }) => (
          <TruncatedColumnTextValue value={row.original.modelName ?? '-'} />
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex min-h-0 grow flex-col overflow-auto px-6 py-5">
      <DataTable
        columns={columns}
        page={runs}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('runs')}
        onRetry={refetch}
        emptyStateIcon={<History className="size-14" />}
        emptyStateTextTitle={t('No flow has run this agent yet')}
        emptyStateTextDescription={t(
          'Add a Run Agent step to a flow and pick this agent. Every run it makes on its own shows up here.',
        )}
      />
    </div>
  );
};
