import { SeekPage } from '@activepieces/core-utils';
import { ProjectCreditUsage } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Coins } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  DataTable,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { NameCell, NumberCell } from '@/components/custom/list/list-cells';
import { PageSection } from '@/components/custom/page';
import { billingQueries } from '@/features/billing';

export function ProjectsUsageTable({
  platformId,
  range,
  enabled = true,
}: {
  platformId: string;
  range: { from: Date; to: Date };
  enabled?: boolean;
}) {
  const [searchParams] = useSearchParams();
  const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;

  const { data, isLoading, isError, refetch } = billingQueries.useProjectsUsage(
    platformId,
    {
      startDate: range.from.toISOString(),
      endDate: range.to.toISOString(),
      cursor,
    },
    enabled,
  );

  const page: SeekPage<ProjectUsageRow> | undefined = data
    ? { ...data, data: data.data.map((row) => ({ ...row, id: row.projectId })) }
    : undefined;

  return (
    <PageSection
      title={t('Where the credits went')}
      description={t('Credits each project spent in the selected range.')}
    >
      <DataTable
        columns={COLUMNS}
        page={page}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('project usage')}
        onRetry={refetch}
        emptyStateIcon={<Coins />}
        emptyStateTextTitle={t('No credits spent in this range')}
        emptyStateTextDescription={t(
          'Once projects run flows or use AI, their credits show here.',
        )}
      />
    </PageSection>
  );
}

function NumericHeader({ title }: { title: string }) {
  return <span className="block text-right">{title}</span>;
}

const COLUMNS: ColumnDef<RowDataWithActions<ProjectUsageRow>, unknown>[] = [
  {
    accessorKey: 'projectName',
    header: () => t('Project'),
    cell: ({ row }) => <NameCell title={row.original.projectName} />,
  },
  {
    id: 'runsCreditsUsed',
    size: 140,
    header: () => <NumericHeader title={t('Runs credits')} />,
    cell: ({ row }) => (
      <NumberCell
        value={Math.round(
          Math.max(0, row.original.creditsUsed - row.original.aiCreditsUsed),
        )}
      />
    ),
  },
  {
    accessorKey: 'aiCreditsUsed',
    size: 140,
    header: () => <NumericHeader title={t('AI credits')} />,
    cell: ({ row }) => (
      <NumberCell value={Math.round(row.original.aiCreditsUsed)} />
    ),
  },
  {
    accessorKey: 'creditsUsed',
    size: 140,
    header: () => <NumericHeader title={t('Total')} />,
    cell: ({ row }) => (
      <NumberCell
        value={Math.round(row.original.creditsUsed)}
        className="font-medium text-gray-12"
      />
    ),
  },
];

type ProjectUsageRow = ProjectCreditUsage & { id: string };
