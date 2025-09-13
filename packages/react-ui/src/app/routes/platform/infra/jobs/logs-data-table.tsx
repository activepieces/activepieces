import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Eye, FileText, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn, formatUtils } from '@/lib/utils';
import { SeekPage, WorkerJobType, WorkerJobLog } from '@activepieces/shared';

import { allMockLogs, getStatusColor, getStatusLabel, STATUS_TYPES } from '.';

export const LogsDataTable = () => {
  const [selectedLog, setSelectedLog] = useState<WorkerJobLog | null>(null);
  const [searchParams] = useSearchParams();

  const limit = parseInt(searchParams.get('limit') || '10');
  const cursor = searchParams.get('cursor');

  const jobTypeFilter = searchParams.getAll('jobType');
  const statusFilter = searchParams.getAll('status');
  const searchFilter = searchParams.get('id') || '';

  const {
    data: logsData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<WorkerJobLog[]>({
    queryKey: ['all-job-logs'],
    queryFn: async () => allMockLogs,
  });

  let filteredData = logsData ? [...logsData] : [];

  if (jobTypeFilter.length > 0 && !jobTypeFilter.includes('all')) {
    filteredData = filteredData.filter((log) =>
      jobTypeFilter.includes(log.jobType),
    );
  }

  if (statusFilter.length > 0 && !statusFilter.includes('all')) {
    filteredData = filteredData.filter((log) =>
      statusFilter.includes(log.status),
    );
  }

  if (searchFilter) {
    filteredData = filteredData.filter((log) =>
      log.id.toLowerCase().includes(searchFilter.toLowerCase()),
    );
  }

  const pageNumber = cursor ? parseInt(cursor, 10) : 0;
  const startIndex = pageNumber * limit;
  const endIndex = startIndex + limit;
  const dataSlice = filteredData.slice(startIndex, endIndex);

  const nextPageCursor =
    endIndex < filteredData.length ? String(pageNumber + 1) : undefined;
  const prevPageCursor = pageNumber > 0 ? String(pageNumber - 1) : undefined;

  const paginatedData: SeekPage<WorkerJobLog> = {
    data: dataSlice,
    next: nextPageCursor ?? null,
    previous: prevPageCursor ?? null,
  };

  const filters = [
    {
      type: 'input',
      title: t('searchJobID'),
      accessorKey: 'id',
      icon: Search,
      placeholder: t('searchByJobIDPlaceholder'),
      options: [],
    } as const,
    {
      type: 'select',
      title: t('jobType'),
      accessorKey: 'jobType',
      icon: FileText,
      options: [
        { label: t('allJobTypes'), value: 'all' },
        ...Object.values(WorkerJobType).map((type) => ({
          label: t(type),
          value: type,
        })),
      ],
    } as const,
    {
      type: 'select',
      title: t('status'),
      accessorKey: 'status',
      icon: Eye,
      options: [
        { label: t('allStatuses'), value: 'all' },
        ...STATUS_TYPES.map((status) => ({
          label: t(getStatusLabel(status)),
          value: status,
        })),
      ],
    } as const,
  ];

  const columns: ColumnDef<RowDataWithActions<WorkerJobLog>>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('jobID')} />
      ),
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedLog(row.original)}
          className="font-mono text-blue-600 hover:underline"
        >
          {row.original.id}
        </button>
      ),
      filterFn: (row, id, value) => {
        if (typeof value === 'string') {
          return row
            .getValue<string>(id)
            .toLowerCase()
            .includes(value.toLowerCase());
        }
        return true;
      },
    },
    {
      accessorKey: 'jobType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('jobType')} />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{t(row.original.jobType)}</div>
      ),
      filterFn: (row, id, value) => {
        if (Array.isArray(value) && value.length > 0) {
          if (value.includes('all')) return true;
          return value.includes(row.getValue(id));
        }
        return true;
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('status')} />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn('h-2.5 w-2.5 rounded-full', getStatusColor(status))}
            />
            <span className="font-medium">{getStatusLabel(status)}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        if (Array.isArray(value) && value.length > 0) {
          if (value.includes('all')) return true;
          return value.includes(row.getValue(id));
        }
        return true;
      },
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('timestamp')} />
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
        <DataTable
          columns={columns}
          page={paginatedData}
          filters={filters}
          isLoading={isLoading}
          emptyStateIcon={<FileText className="h-12 w-12" />}
          emptyStateTextTitle={t('noLogsFound')}
          emptyStateTextDescription={t('tryAdjustingFilters')}
        />
      </div>

      <Drawer
        open={!!selectedLog}
        onOpenChange={(isOpen) => !isOpen && setSelectedLog(null)}
        direction="right"
      >
        <DrawerContent className="flex h-full w-full flex-col sm:w-2/5">
          {selectedLog && (
            <>
              <DrawerHeader className="border-b p-4">
                <DrawerTitle>
                  {t('jobDataTitle')}: {selectedLog.id}
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex-grow overflow-auto p-4">
                <pre className="h-full w-full rounded-lg bg-slate-100 p-4 text-xs">
                  {JSON.stringify(selectedLog.data, null, 2)}
                </pre>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};
