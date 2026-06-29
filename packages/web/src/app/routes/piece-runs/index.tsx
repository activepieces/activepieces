import { PieceRun, PieceRunStatus } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Activity,
  CalendarIcon,
  CheckIcon,
  Clock,
  Hash,
  Puzzle,
  XIcon,
  Zap,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import {
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { pieceRunsQueries } from '@/features/piece-runs';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';

function pieceRunDuration(pieceRun: PieceRun): number | undefined {
  if (!pieceRun.finishTime) {
    return undefined;
  }
  return (
    new Date(pieceRun.finishTime).getTime() -
    new Date(pieceRun.startTime).getTime()
  );
}

function PieceRunStatusCell({ status }: { status: PieceRunStatus }) {
  if (status === PieceRunStatus.SUCCEEDED) {
    return (
      <StatusIconWithText
        icon={CheckIcon}
        text={t('Succeeded')}
        variant="success"
      />
    );
  }
  return <StatusIconWithText icon={XIcon} text={t('Failed')} variant="error" />;
}

function PieceRunsPage() {
  const location = useLocation();
  const { pieces } = piecesHooks.usePieces({});
  const projectId = authenticationSession.getProjectId()!;

  const pieceOptions = (pieces ?? []).map((piece) => ({
    label: piece.displayName,
    value: piece.name,
  }));

  const searchParams = new URLSearchParams(location.search);
  const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;
  const limit = searchParams.get(LIMIT_QUERY_PARAM)
    ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
    : 10;
  const status = searchParams.getAll('status') as PieceRunStatus[];
  const pieceName = searchParams.get('pieceName') ?? undefined;

  const { data: pieceRuns, isLoading } = pieceRunsQueries.usePieceRuns({
    request: {
      projectId,
      cursor,
      limit,
      status,
      pieceName,
    },
    extraKeys: [location.search, projectId],
  });

  const filters: DataTableFilters<keyof PieceRun>[] = [
    {
      type: 'select',
      title: t('Status'),
      accessorKey: 'status',
      icon: CheckIcon,
      options: Object.values(PieceRunStatus).map((value) => ({
        label: formatUtils.convertEnumToHumanReadable(value),
        value,
      })),
    },
    {
      type: 'select',
      title: t('Pieces'),
      accessorKey: 'pieceName',
      icon: Puzzle,
      options: pieceOptions,
    },
  ];

  const columns: ColumnDef<RowDataWithActions<PieceRun>, unknown>[] = [
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Status')}
          icon={Activity}
        />
      ),
      cell: ({ row }) => <PieceRunStatusCell status={row.original.status} />,
    },
    {
      accessorKey: 'pieceName',
      size: 240,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Piece')}
          icon={Puzzle}
        />
      ),
      cell: ({ row }) => (
        <PieceIconWithPieceName
          pieceName={row.original.pieceName}
          showTooltip={false}
          size="sm"
        />
      ),
    },
    {
      accessorKey: 'actionName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Action')} icon={Zap} />
      ),
      cell: ({ row }) => (
        <span className="truncate">{row.original.actionName}</span>
      ),
    },
    {
      accessorKey: 'connectionExternalId',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Connection')}
          icon={Puzzle}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.connectionExternalId ?? '-'}
        </span>
      ),
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Created')}
          icon={CalendarIcon}
        />
      ),
      cell: ({ row }) => (
        <FormattedDate date={new Date(row.original.created)} />
      ),
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Duration')}
          icon={Clock}
        />
      ),
      cell: ({ row }) => (
        <span>
          {formatUtils.formatDuration(pieceRunDuration(row.original), true)}
        </span>
      ),
    },
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Run ID')}
          icon={Hash}
        />
      ),
      cell: ({ row }) => (
        <CopyTextTooltip title={t('Run ID')} text={row.original.id}>
          <span className="truncate max-w-[120px] text-muted-foreground">
            {row.original.id}
          </span>
        </CopyTextTooltip>
      ),
    },
  ];

  return (
    <div className="flex-col w-full">
      <DataTable
        emptyStateTextTitle={t('No piece runs yet')}
        emptyStateTextDescription={t(
          'Piece actions executed through the SDK will appear here.',
        )}
        emptyStateIcon={<Zap className="size-14" />}
        columns={columns}
        page={pieceRuns}
        isLoading={isLoading}
        filters={filters}
      />
    </div>
  );
}

export { PieceRunsPage };
