import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Tag } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { LoadingScreen } from '@/app/components/loading-screen';
import { ApMarkdown } from '@/components/custom/markdown';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { TableTitle } from '@/components/ui/table-title';
import { UserFullName } from '@/components/ui/user-fullname';
import { manualTaskApi } from '@/features/manual-tasks/lib/manual-task-api';
import { formatUtils } from '@/lib/utils';
import {
  ManualTask,
  ManualTaskWithAssignee,
  NO_ANSWER_STATUS,
} from '@activepieces/ee-shared';
import { isNil, MarkdownVariant } from '@activepieces/shared';

import { TaskDetails } from '../task-details';

function ManualTaskTestingPage() {
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Array<ManualTask>>([]);
  const [selectedTask, setSelectedTask] =
    useState<ManualTaskWithAssignee | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { manualTaskId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['manualTask', manualTaskId],
    queryFn: () => {
      if (!manualTaskId) return null;
      return manualTaskApi.get(manualTaskId);
    },
    enabled: !!manualTaskId,
    staleTime: 0,
  });

  const columns: ColumnDef<
    RowDataWithActions<ManualTaskWithAssignee>,
    unknown
  >[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()
          }
          onCheckedChange={(value) => {
            const isChecked = !!value;
            table.toggleAllPageRowsSelected(isChecked);

            if (isChecked) {
              const allRows = table
                .getRowModel()
                .rows.map((row) => row.original);

              const newSelectedRows = [...allRows, ...selectedRows];

              const uniqueRows = Array.from(
                new Map(
                  newSelectedRows.map((item) => [item.id, item]),
                ).values(),
              );

              setSelectedRows(uniqueRows);
            } else {
              const filteredRows = selectedRows.filter((row) => {
                return !table
                  .getRowModel()
                  .rows.some((r) => r.original.id === row.id);
              });
              setSelectedRows(filteredRows);
            }
          }}
        />
      ),
      cell: ({ row }) => {
        const isChecked = selectedRows.some(
          (selectedRow) => selectedRow.id === row.original.id,
        );
        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              let newSelectedRows = [...selectedRows];
              if (isChecked) {
                const exists = newSelectedRows.some(
                  (selectedRow) => selectedRow.id === row.original.id,
                );
                if (!exists) {
                  newSelectedRows.push(row.original);
                }
              } else {
                newSelectedRows = newSelectedRows.filter(
                  (selectedRow) => selectedRow.id !== row.original.id,
                );
              }
              setSelectedRows(newSelectedRows);
              row.toggleSelected(!!value);
            }}
          />
        );
      },
      accessorKey: 'select',
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Title')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">{row.original.title}</div>
        );
      },
    },
    {
      accessorKey: 'assignee',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Assigned to')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.assignee && (
              <UserFullName
                firstName={row.original.assignee.firstName}
                lastName={row.original.assignee.lastName}
                email={row.original.assignee.email}
              />
            )}
            {!row.original.assignee && <div className="text-left">-</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            <StatusIconWithText
              icon={CheckIcon}
              text={row.original.status.name}
              color={row.original.status.color}
              textColor={row.original.status.textColor}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Date Created')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {formatUtils.formatDate(new Date(row.original.created))}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (
    isNil(data) ||
    data.status.name !== NO_ANSWER_STATUS.name ||
    isStatusChanged
  ) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-8 text-center">
        <h3 className="text-lg font-medium">
          {t('Manual task already answered')}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {t('You can only answer a manual task once.')}
        </p>
      </div>
    );
  }

  return (
    <>
      {!isLoading && (
        <div className="flex flex-col w-full max-w-7xl mx-auto my-10 space-y-4">
          <TableTitle description={t('Manage manual tasks for your project.')}>
            {t('Manual Tasks')}
          </TableTitle>

          <div className="mb-6 p-3 bg-slate-50 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-gray-600" />
              <div className="font-medium text-base">{t('Instructions')}</div>
            </div>
            <ApMarkdown
              markdown={
                'Click on any task row to view details and update its status.'
              }
              variant={MarkdownVariant.TIP}
            />
          </div>

          <DataTable
            columns={columns}
            page={{
              data: data ? [data] : [],
              next: null,
              previous: null,
            }}
            isLoading={isLoading}
            onRowClick={(row) => {
              setSelectedTask(row);
              setDrawerOpen(true);
            }}
          />

          {selectedTask && (
            <TaskDetails
              key={selectedTask.id}
              currentTask={selectedTask}
              isTesting={true}
              setIsStatusChanged={() => setIsStatusChanged(true)}
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              onClose={() => {
                setSelectedTask(null);
                setDrawerOpen(false);
              }}
              onNext={() => {}}
              onPrevious={() => {}}
            />
          )}
        </div>
      )}
    </>
  );
}

export { ManualTaskTestingPage };
