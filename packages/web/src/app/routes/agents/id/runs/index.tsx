import { isNil } from '@activepieces/core-utils';
import { AgentRunListItem } from '@activepieces/shared';
import {
  Clock01Icon,
  CoinsDollarIcon,
  HistoryIcon,
  HourglassIcon,
  Pulse01Icon,
  Robot01Icon,
  WorkflowSquare02Icon,
} from '@hugeicons/core-free-icons';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/custom/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/custom/formatted-date';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { agentRunUtils } from '@/features/agents/lib/agent-run-utils';
import { projectCollectionUtils } from '@/features/projects';
import { formatUtils } from '@/lib/format-utils';

import { RunDetailPanel } from './run-detail-panel';

type AgentRunsProps = {
  agentId: string;
};

export const AgentRuns = ({ agentId }: AgentRunsProps) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const {
    data: runs,
    isLoading,
    isError,
    refetch,
  } = agentsQueries.useAgentRuns({ agentId, projectId: project.id });

  const columns: ColumnDef<RowDataWithActions<AgentRunListItem>>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        size: 380,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Run')}
            icon={Robot01Icon}
          />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="flex items-center gap-2 text-left hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setOpenRunId(row.original.id);
            }}
          >
            <TruncatedColumnTextValue
              value={row.original.title ?? t('Untitled run')}
              className="max-w-[260px] 2xl:max-w-[420px]"
            />
          </button>
        ),
      },
      {
        accessorKey: 'flow',
        size: 220,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Flow')}
            icon={WorkflowSquare02Icon}
          />
        ),
        cell: ({ row }) => {
          const flow = row.original.flow;
          if (isNil(flow)) {
            return <span className="text-gray-11">{'\u2014'}</span>;
          }
          return (
            <div className="flex items-center gap-2 text-left">
              <TruncatedColumnTextValue value={flow.displayName} />
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Status')}
            icon={Pulse01Icon}
          />
        ),
        cell: ({ row }) => {
          const { Icon, variant } = agentRunUtils.getStatusIcon(
            row.original.status,
          );
          return (
            <div className="text-left">
              <StatusIconWithText
                icon={Icon}
                text={agentRunUtils.getStatusLabel(row.original.status)}
                variant={variant}
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'updated',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Duration')}
            icon={HourglassIcon}
          />
        ),
        cell: ({ row }) => {
          const durationMs = agentRunUtils.getDurationMs(row.original);
          return (
            <span className="text-left text-gray-11">
              {isNil(durationMs)
                ? '\u2014'
                : formatUtils.formatDuration(durationMs, true)}
            </span>
          );
        },
      },
      {
        accessorKey: 'aiCredits',
        size: 130,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Credits')}
            icon={CoinsDollarIcon}
          />
        ),
        cell: ({ row }) => (
          <span className="text-left text-gray-11">
            {isNil(row.original.aiCredits) ? '\u2014' : row.original.aiCredits}
          </span>
        ),
      },
      {
        accessorKey: 'created',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Started At')}
            icon={Clock01Icon}
          />
        ),
        cell: ({ row }) => (
          <FormattedDate
            date={new Date(row.original.created)}
            className="text-left"
          />
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <DataTable
        columns={columns}
        page={runs}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('runs')}
        onRetry={refetch}
        onRowClick={(row) => setOpenRunId(row.id)}
        emptyStateIcon={
          <HugeiconsIcon icon={HistoryIcon} className="size-14" />
        }
        emptyStateTextTitle={t('No flow has run this agent yet')}
        emptyStateTextDescription={t(
          'Add a Run Agent step to a flow and pick this agent. Every run it makes on its own shows up here.',
        )}
      />
      <RunDetailPanel runId={openRunId} onClose={() => setOpenRunId(null)} />
    </div>
  );
};
