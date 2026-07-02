import { SeekPage } from '@activepieces/core-utils';
import { ProjectCreditUsage } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Coins } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DateTimePickerWithRange } from '@/components/custom/date-time-picker-range';
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

  const { data, isLoading } = billingQueries.useProjectsUsage(
    platformId,
    { startDate: range.from.toISOString(), endDate: range.to.toISOString() },
    enabled,
  );

  const page: SeekPage<ProjectUsageRow> = {
    data: (data ?? []).map((row) => ({ ...row, id: row.projectId })),
    next: null,
    previous: null,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t('Usage by Projects')}</h2>
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
      </div>
      <DataTable
        columns={COLUMNS}
        page={page}
        isLoading={isLoading}
        clientPagination
        initialSorting={[{ id: 'creditsUsed', desc: true }]}
        emptyStateIcon={<Coins className="size-14 text-muted-foreground" />}
        emptyStateTextTitle={t('No project usage yet')}
        emptyStateTextDescription={t(
          'Once your projects consume credits, their usage will appear here.',
        )}
      />
    </div>
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
        className="truncate text-sm font-medium text-primary hover:underline"
      >
        {projectName}
      </button>
    </TextWithTooltip>
  );
}

const COLUMNS: ColumnDef<RowDataWithActions<ProjectUsageRow>, unknown>[] = [
  {
    accessorKey: 'projectName',
    header: () => <span className="text-sm">{t('Project')}</span>,
    cell: ({ row }) => (
      <ProjectNameLink
        projectId={row.original.projectId}
        projectName={row.original.projectName}
      />
    ),
  },
  {
    accessorKey: 'creditsUsed',
    header: () => <span className="text-sm">{t('Credits Used')}</span>,
    cell: ({ row }) => (
      <span className="text-sm">
        {Math.round(row.original.creditsUsed).toLocaleString()}
      </span>
    ),
  },
];

type ProjectUsageRow = ProjectCreditUsage & { id: string };
