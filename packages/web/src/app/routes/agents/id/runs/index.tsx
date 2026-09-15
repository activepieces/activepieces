import { isNil } from '@activepieces/core-utils';
import { AgentRunListItem } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Activity, Bot, Clock, History, Workflow } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/custom/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { agentRunUtils } from '@/features/agents/lib/agent-run-utils';
import { projectCollectionUtils } from '@/features/projects';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';

type AgentRunsProps = {
  agentId: string;
};

export const AgentRuns = ({ agentId }: AgentRunsProps) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const navigate = useNavigate();
  const openNewWindow = useNewWindow();
  const openFlowRun = useCallback(
    (run: AgentRunListItem, newWindow: boolean) => {
      if (isNil(run.flow)) {
        return;
      }
      const to = authenticationSession.appendProjectRoutePrefix(
        `/runs/${run.flow.flowRunId}`,
      );
      if (newWindow) {
        openNewWindow(to);
        return;
      }
      navigate(to);
    },
    [navigate, openNewWindow],
  );
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
          <DataTableColumnHeader column={column} title={t('Run')} icon={Bot} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-left">
            <TruncatedColumnTextValue
              value={row.original.title ?? t('Untitled run')}
              className="max-w-[260px] 2xl:max-w-[420px]"
            />
          </div>
        ),
      },
      {
        accessorKey: 'flow',
        size: 220,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Flow')}
            icon={Workflow}
          />
        ),
        cell: ({ row }) => {
          const flow = row.original.flow;
          if (isNil(flow)) {
            return <span className="text-muted-foreground">{'\u2014'}</span>;
          }
          return (
            <Link
              to={authenticationSession.appendProjectRoutePrefix(
                `/runs/${flow.flowRunId}`,
              )}
              className="flex items-center gap-2 text-left hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <TruncatedColumnTextValue value={flow.displayName} />
            </Link>
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
            icon={Activity}
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
        accessorKey: 'created',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Started At')}
            icon={Clock}
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
    <div className="flex h-full w-full flex-col pt-2">
      <DataTable
        columns={columns}
        page={runs}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('runs')}
        onRetry={refetch}
        onRowClick={(row, newWindow) => openFlowRun(row, newWindow)}
        getRowClassName={(row) => (isNil(row.flow) ? 'cursor-default' : '')}
        emptyStateIcon={<History className="size-14" />}
        emptyStateTextTitle={t('No flow has run this agent yet')}
        emptyStateTextDescription={t(
          'Add a Run Agent step to a flow and pick this agent. Every run it makes on its own shows up here.',
        )}
      />
    </div>
  );
};
