import { InternalErrorImpactItem } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CircleCheck } from 'lucide-react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { NameCell, NumberCell } from '@/components/custom/list/list-cells';
import { PageSection } from '@/components/custom/page';

export function InternalErrorsTable({
  internalErrors,
  isLoading,
}: InternalErrorsTableProps) {
  const errors = internalErrors ?? [];
  const total = errors.reduce((sum, error) => sum + error.count, 0);
  const rows: ErrorRow[] = errors.map((error) => ({
    ...error,
    id: `${error.projectId}-${error.flowId}`,
    share: total === 0 ? 0 : Math.round((error.count / total) * 100),
  }));

  return (
    <PageSection
      title={t('Internal errors')}
      description={t(
        'Failures inside Activepieces itself (engine or worker), not in your flow logic, grouped by the flow they hit.',
      )}
    >
      <DataTable
        columns={COLUMNS}
        page={{ data: rows, next: null, previous: null }}
        hidePagination
        isLoading={isLoading}
        isError={false}
        errorStateEntity={t('internal errors')}
        onRowClick={(row) =>
          window.open(
            `/projects/${row.projectId}/runs?flowId=${row.flowId}`,
            '_blank',
            'noopener',
          )
        }
        emptyStateTextTitle={t('No internal errors this month')}
        emptyStateTextDescription={t(
          'Every failed run this month failed inside its own flow logic.',
        )}
        emptyStateIcon={<CircleCheck />}
      />
    </PageSection>
  );
}

const COLUMNS: ColumnDef<RowDataWithActions<ErrorRow>, unknown>[] = [
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
    accessorKey: 'count',
    size: 120,
    header: () => <span className="block text-right">{t('Errors')}</span>,
    cell: ({ row }) => <NumberCell value={row.original.count} />,
  },
  {
    accessorKey: 'share',
    size: 120,
    header: () => <span className="block text-right">{t('Share')}</span>,
    cell: ({ row }) => <NumberCell>{`${row.original.share}%`}</NumberCell>,
  },
];

type ErrorRow = InternalErrorImpactItem & { id: string; share: number };

type InternalErrorsTableProps = {
  internalErrors: InternalErrorImpactItem[] | undefined;
  isLoading: boolean;
};
