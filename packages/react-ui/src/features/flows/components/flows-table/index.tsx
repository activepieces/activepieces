import { t } from 'i18next';

import {
  CheckIcon,
  Workflow,
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { authenticationSession } from '@/lib/authentication-session';
import { FlowStatus, PopulatedFlow } from '@activepieces/shared';
import { formatUtils } from '@/lib/utils';
import { flowsTableColumns } from './columns';
import { useEmbedding } from '@/components/embed-provider';
import { useNewWindow } from '@/lib/navigation-utils';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useFlowsBulkActions } from '@/features/flows/lib/use-flows-bulk-actions';
import { FolderFilterList } from '@/features/folders/component/folder-filter-list';

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
  data: any;
  isLoading: boolean;
  refetch: () => void;
}

export const FlowsTable = ({ data, isLoading, refetch }: FlowsTableProps) => {

  const { embedState } = useEmbedding();
  const openNewWindow = useNewWindow();

  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Array<PopulatedFlow>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const columns = useMemo(() => {
    return flowsTableColumns({ refresh, setRefresh, selectedRows, setSelectedRows })
  }, [refresh, setRefresh, selectedRows, setSelectedRows])

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
      {!embedState.hideFolders && <FolderFilterList refresh={refresh} />}
      <div className="w-full">
        <DataTable
          emptyStateTextTitle={t('No flows found')}
          emptyStateTextDescription={t(
            'Create a workflow to start automating',
          )}
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
  )
}
