import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Play } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { agentRunHooks } from '@/features/agents/lib/agent-hooks';
import { agentRunUtils } from '@/features/agents/lib/agent-run-utils';
import { formatUtils } from '@/lib/utils';
import { AgentRun } from '@activepieces/shared';

import { AgentRunDrawer } from './agent-run-drawer';

interface AgentRunsTableProps {
  agentId: string;
}

export function AgentRunsTable({ agentId }: AgentRunsTableProps) {
  const { data, isLoading } = agentRunHooks.useList({ agentId });
  const [selectedAgentRunId, setSelectedAgentRunId] = useState<string | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const columns: ColumnDef<RowDataWithActions<AgentRun>, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'prompt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Prompt')} />
        ),
        cell: ({ row }) => (
          <div
            className="text-left text-xs truncate max-w-xs"
            title={row.original.prompt}
          >
            {row.original.prompt}
          </div>
        ),
      },
      {
        accessorKey: 'created',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Started At')} />
        ),
        cell: ({ row }) => (
          <div className="text-left">
            {formatUtils.formatDate(new Date(row.original.created))}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Status')} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const { variant, Icon } = agentRunUtils.getStatusIcon(status);
          return (
            <div className="text-left">
              <StatusIconWithText
                icon={Icon}
                text={formatUtils.convertEnumToHumanReadable(status)}
                variant={variant}
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'duration',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Duration')} />
        ),
        cell: ({ row }) => {
          const { startTime, finishTime } = row.original;
          let durationStr = '-';
          if (startTime && finishTime) {
            const diff =
              new Date(finishTime).getTime() - new Date(startTime).getTime();
            if (diff > 0) {
              durationStr = formatUtils.formatDuration(diff);
            }
          }
          return <div className="text-left">{durationStr}</div>;
        },
      },
    ],
    [],
  );

  const handleRowClick = (agentRun: AgentRun) => {
    setSelectedAgentRunId(agentRun.id);
    setDrawerOpen(true);
  };

  return (
    <div className="flex-col w-full container mt-10">
      <div className="mb-4">
        <span className="font-bold text-lg">All Runs</span>
      </div>
      <DataTable
        emptyStateTextTitle={t('No runs found')}
        emptyStateTextDescription={t(
          'This agent has not been run yet. Try running it to see results here.',
        )}
        emptyStateIcon={<Play className="size-14" />}
        columns={columns}
        page={data}
        isLoading={isLoading}
        filters={[]}
        bulkActions={[]}
        onRowClick={handleRowClick}
      />
      <AgentRunDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        agentRunId={selectedAgentRunId}
      />
    </div>
  );
}
