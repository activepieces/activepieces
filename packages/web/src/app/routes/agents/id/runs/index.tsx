import {
  AgentConversation,
  AgentConversationStatus,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Check, CircleX, History, Loader } from 'lucide-react';

import {
  DataTable,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { formatUtils } from '@/lib/format-utils';

type AgentRunsProps = {
  agentId: string;
  onOpenRun: (conversationId: string) => void;
};

export const AgentRuns = ({ agentId, onOpenRun }: AgentRunsProps) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const {
    data: runs,
    isLoading,
    isError,
    refetch,
  } = agentsQueries.useAgentRuns({ agentId, projectId: project.id });

  const columns: ColumnDef<RowDataWithActions<AgentConversation>>[] = [
          {
            accessorKey: 'status',
            size: 150,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Status')} />
            ),
            cell: ({ row }) => {
              const { icon, text, variant } = runStatus(row.original.status);
              return (
                <StatusIconWithText icon={icon} text={text} variant={variant} />
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
              <span className="text-sm text-muted-foreground">
                {formatUtils.formatDate(new Date(row.original.created))}
              </span>
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
                {formatUtils.formatDuration(runDurationMs(row.original), true)}
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
              <span className="text-sm text-muted-foreground">
                {row.original.modelName ?? '-'}
              </span>
            ),
          },
  ];

  return (
    <div className="flex min-h-0 grow flex-col overflow-auto px-6 py-5">
      <DataTable
        columns={columns}
        page={runs}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('runs')}
        onRetry={refetch}
        onRowClick={(row) => onOpenRun(row.id)}
        emptyStateIcon={<History className="size-14" />}
        emptyStateTextTitle={t('No flow has run this agent yet')}
        emptyStateTextDescription={t(
          'Add a Run Agent step to a flow and pick this agent. Every run it makes on its own shows up here.',
        )}
      />
    </div>
  );
};

const runDurationMs = (run: AgentConversation): number | undefined => {
  const stillRunning = run.status === AgentConversationStatus.STREAMING;
  if (stillRunning) {
    return undefined;
  }
  return new Date(run.updated).getTime() - new Date(run.created).getTime();
};

const runStatus = (status: AgentConversationStatus) => {
  switch (status) {
    case AgentConversationStatus.STREAMING:
      return { icon: Loader, text: t('Running'), variant: 'default' as const };
    case AgentConversationStatus.ERROR:
      return { icon: CircleX, text: t('Failed'), variant: 'error' as const };
    case AgentConversationStatus.IDLE:
      return { icon: Check, text: t('Completed'), variant: 'success' as const };
  }
};
