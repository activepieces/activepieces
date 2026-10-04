import { FlowRunStatus, StuckJob } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CircleCheck } from 'lucide-react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { NameCell } from '@/components/custom/list/list-cells';
import { PageSection } from '@/components/custom/page';
import { StatusDot } from '@/components/custom/status-dot';
import { formatUtils } from '@/lib/format-utils';

export function StuckJobsTable({ stuckJobs, isLoading }: StuckJobsTableProps) {
  const rows: StuckRow[] = (stuckJobs ?? []).map((job) => ({
    ...job,
    id: job.flowRunId,
  }));
  return (
    <PageSection
      title={t('Stuck jobs')}
      description={t(
        'Runs that stopped reporting progress. Open one to see where it stopped.',
      )}
    >
      <DataTable
        columns={COLUMNS}
        page={{ data: rows, next: null, previous: null }}
        hidePagination
        isLoading={isLoading}
        isError={false}
        errorStateEntity={t('stuck jobs')}
        onRowClick={(row) =>
          window.open(
            `/projects/${row.projectId}/runs/${row.flowRunId}`,
            '_blank',
            'noopener',
          )
        }
        emptyStateTextTitle={t('No stuck jobs')}
        emptyStateTextDescription={t(
          'Every run in this period finished or is still moving.',
        )}
        emptyStateIcon={<CircleCheck />}
      />
    </PageSection>
  );
}

const COLUMNS: ColumnDef<RowDataWithActions<StuckRow>, unknown>[] = [
  {
    accessorKey: 'flowName',
    header: () => t('Flow'),
    cell: ({ row }) => (
      <NameCell
        stacked
        title={row.original.flowName}
        sub={row.original.projectName}
      />
    ),
  },
  {
    accessorKey: 'status',
    size: 200,
    header: () => t('Status'),
    cell: ({ row }) => (
      <StatusDot
        tone={
          row.original.status === FlowRunStatus.QUEUED ? 'warning' : 'accent'
        }
      >
        {formatUtils.convertEnumToHumanReadable(row.original.status)}
      </StatusDot>
    ),
  },
];

type StuckRow = StuckJob & { id: string };

type StuckJobsTableProps = {
  stuckJobs: StuckJob[] | undefined;
  isLoading: boolean;
};
