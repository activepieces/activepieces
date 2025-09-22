import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckIcon, Link2, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { DataTable } from '@/components/ui/data-table';
import { appConnectionsQueries } from '@/features/connections/lib/app-connections-hooks';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useFlowsBulkActions } from '@/features/flows/lib/use-flows-bulk-actions';
import { FolderFilterList } from '@/features/folders/component/folder-filter-list';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { formatUtils } from '@/lib/utils';
import { FlowStatus, PopulatedFlow } from '@activepieces/shared';

import { flowsTableColumns } from './columns';

type FlowsTableProps = {
  refetch?: () => void;
};

export const FlowsTable = ({ refetch: parentRefetch }: FlowsTableProps) => {
  const { embedState } = useEmbedding();
  const openNewWindow = useNewWindow();
  const [searchParams] = useSearchParams();
  const projectId = authenticationSession.getProjectId()!;

  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Array<PopulatedFlow>>([]);
  const { pieces } = piecesHooks.usePieces({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['flow-table', searchParams.toString(), projectId, refresh],
    staleTime: 0,
    queryFn: () => {
      const name = searchParams.get('name');
      const status = searchParams.getAll('status') as FlowStatus[];
      const cursor = searchParams.get('cursor');
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;
      const folderId = searchParams.get('folderId') ?? undefined;
      const connectionExternalId =
        searchParams.getAll('connectionExternalId') ?? undefined;

      return flowsApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
        name: name ?? undefined,
        status,
        folderId,
        connectionExternalIds: connectionExternalId,
      });
    },
  });

  const { data: connections, isLoading: isLoadingConnections } =
    appConnectionsQueries.useAppConnections({
      request: {
        projectId,
        limit: 10000,
      },
      extraKeys: [projectId, refresh],
    });

  const handleRefetch = () => {
    refetch();
    if (parentRefetch) {
      parentRefetch();
    }
  };

  const columns = useMemo(() => {
    return flowsTableColumns({
      refetch: handleRefetch,
      refresh,
      setRefresh,
      selectedRows,
      setSelectedRows,
    });
  }, [refresh, handleRefetch, selectedRows]);

  const filters = [
    {
      type: 'input',
      title: t('Flow name'),
      accessorKey: 'name',
      options: [],
      icon: CheckIcon,
    } as const,
    {
      type: 'select',
      title: t('Status'),
      accessorKey: 'status',
      options: Object.values(FlowStatus).map((status) => {
        return {
          label: formatUtils.convertEnumToHumanReadable(status),
          value: status,
        };
      }),
      icon: CheckIcon,
    } as const,
    {
      type: 'select',
      title: t('Connection'),
      accessorKey: 'connectionExternalId',
      options: (connections?.data || []).map((connection) => {
        return {
          label: connection.displayName,
          value: connection.externalId,
          icon: pieces?.find((p) => p.name === connection.pieceName)?.logoUrl,
        };
      }),
      icon: Link2,
    } as const,
  ];

  const bulkActions = useFlowsBulkActions({
    selectedRows,
    refresh,
    setSelectedRows,
    setRefresh,
    refetch: handleRefetch,
  });

  return (
    <div className="flex flex-row gap-8">
      {!embedState.hideFolders && (
        <FolderFilterList key="folder-filter" refresh={refresh} />
      )}
      <div className="overflow-hidden w-full ">
        <DataTable
          emptyStateTextTitle={t('No flows found')}
          emptyStateTextDescription={t('Create a workflow to start automating')}
          emptyStateIcon={<Workflow className="size-14" />}
          columns={columns.filter(
            (column) =>
              !embedState.hideFolders || column.accessorKey !== 'folderId',
          )}
          page={data}
          isLoading={isLoading || isLoadingConnections}
          filters={filters}
          bulkActions={bulkActions}
          onRowClick={(row, newWindow) => {
            if (newWindow) {
              openNewWindow(
                authenticationSession.appendProjectRoutePrefix(
                  `/flows/${row.id}`,
                ),
              );
            } else {
              navigate(
                authenticationSession.appendProjectRoutePrefix(
                  `/flows/${row.id}`,
                ),
              );
            }
          }}
        />
      </div>
    </div>
  );
};
