import { t } from 'i18next';
import { CheckIcon, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { DataTable } from '@/components/ui/data-table';
import { useFlowsBulkActions } from '@/features/flows/lib/use-flows-bulk-actions';
import { FolderFilterList } from '@/features/folders/component/folder-filter-list';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { formatUtils } from '@/lib/utils';
import { FlowStatus, PopulatedFlow, SeekPage } from '@activepieces/shared';

import { flowsTableColumns } from './columns';

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
];

type FlowsTableProps = {
  data: SeekPage<PopulatedFlow> | undefined;
  isLoading: boolean;
  refetch: () => void;
};

export const FlowsTable = ({ data, isLoading, refetch }: FlowsTableProps) => {
  const { embedState } = useEmbedding();
  const openNewWindow = useNewWindow();

  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Array<PopulatedFlow>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const columns = useMemo(() => {
    return flowsTableColumns({
      refetch,
      refresh,
      setRefresh,
      selectedRows,
      setSelectedRows,
    });
  }, [refresh, setRefresh, selectedRows, setSelectedRows]);

  const bulkActions = useFlowsBulkActions({
    selectedRows,
    isDropdownOpen,
    setIsDropdownOpen,
    refresh,
    setSelectedRows,
    setRefresh,
    refetch,
  });

  return (
    <div className="flex flex-row gap-4">
      <div className="w-full">
        <DataTable
          customFilters={
            !embedState.hideFolders
              ? [<FolderFilterList key="folder-filter" refresh={refresh} />]
              : []
          }
          emptyStateTextTitle={t('No flows found')}
          emptyStateTextDescription={t('Create a workflow to start automating')}
          emptyStateIcon={<Workflow className="size-14" />}
          columns={columns.filter(
            (column) =>
              !embedState.hideFolders || column.accessorKey !== 'folderId',
          )}
          page={data}
          isLoading={isLoading}
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
