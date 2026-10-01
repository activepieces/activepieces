import { SeekPage } from '@activepieces/core-utils';
import { ProjectCreditUsage } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Coins } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  DataTable,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DateTimePickerWithRange } from '@/components/custom/date-time-picker-range';
import { PageSection } from '@/components/custom/page';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { billingQueries } from '@/features/billing';
import { projectCollectionUtils } from '@/features/projects';

export function ProjectsUsageTable({
  platformId,
  enabled = true,
}: {
  platformId: string;
  enabled?: boolean;
}) {
  const [range, setRange] = useState<{ from: Date; to: Date }>(() => ({
    from: dayjs().subtract(30, 'day').startOf('day').toDate(),
    to: dayjs().endOf('day').toDate(),
  }));
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
      action={
        <DateTimePickerWithRange
          presetType="past"
          from={range.from.toISOString()}
          to={range.to.toISOString()}
          onChange={(selected) => {
            if (selected?.from && selected?.to) {
              setRange({ from: selected.from, to: selected.to });
            }
          }}
        />
      }
    >
      <DataTable
        columns={COLUMNS}
        page={page}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('project usage')}
        onRetry={refetch}
        emptyStateIcon={<Coins />}
        emptyStateTextTitle={t('No project usage yet')}
        emptyStateTextDescription={t(
          'Once your projects consume credits, their usage will appear here.',
        )}
      />
    </PageSection>
  );
}

function ProjectNameLink({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const navigate = useNavigate();
  const goToProjectHome = () => {
    projectCollectionUtils.setCurrentProject(projectId);
    navigate('/');
  };
  return (
    <TextWithTooltip tooltipMessage={projectName}>
      <button
        type="button"
        onClick={goToProjectHome}
        className="truncate text-sm font-medium text-gray-12 hover:underline"
      >
        {projectName}
      </button>
    </TextWithTooltip>
  );
}

function CreditsCell({ value }: { value: number }) {
  return (
    <div className="text-right text-sm text-gray-12 tabular-nums">
      {Math.round(value).toLocaleString()}
    </div>
  );
}

function NumericHeader({ title }: { title: string }) {
  return <div className="text-right">{title}</div>;
}

const COLUMNS: ColumnDef<RowDataWithActions<ProjectUsageRow>, unknown>[] = [
  {
    accessorKey: 'projectName',
    header: () => t('Project'),
    cell: ({ row }) => (
      <ProjectNameLink
        projectId={row.original.projectId}
        projectName={row.original.projectName}
      />
    ),
  },
  {
    id: 'runsCreditsUsed',
    size: 140,
    header: () => <NumericHeader title={t('Runs credits')} />,
    cell: ({ row }) => (
      <CreditsCell
        value={Math.max(
          0,
          row.original.creditsUsed - row.original.aiCreditsUsed,
        )}
      />
    ),
  },
  {
    accessorKey: 'aiCreditsUsed',
    size: 140,
    header: () => <NumericHeader title={t('AI credits')} />,
    cell: ({ row }) => <CreditsCell value={row.original.aiCreditsUsed} />,
  },
  {
    accessorKey: 'creditsUsed',
    size: 140,
    header: () => <NumericHeader title={t('Total')} />,
    cell: ({ row }) => <CreditsCell value={row.original.creditsUsed} />,
  },
];

type ProjectUsageRow = ProjectCreditUsage & { id: string };
