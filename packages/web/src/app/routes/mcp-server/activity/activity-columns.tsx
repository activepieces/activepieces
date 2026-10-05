import { PopulatedMcpActivity, ProjectType } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DateCell, MutedCell } from '@/components/custom/list/list-cells';
import { StatusDot } from '@/components/custom/status-dot';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { PieceIcon } from '@/features/pieces/components/piece-icon';

import { ClientIcon } from '../client-icon';
import { mcpClientDisplay } from '../mcp-client-display';

import { activityUtils } from './activity-utils';

export function buildActivityColumns({
  currentUserId,
  showMember,
  resolveActionDisplayName,
  resolvePieceDisplayName,
  resolvePieceLogoUrl,
  resolveProjectType,
}: BuildActivityColumnsParams): ActivityColumn[] {
  const when: ActivityColumn = {
    accessorKey: 'when',
    size: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('When')} />
    ),
    cell: ({ row }) => <DateCell value={row.original.created} />,
  };

  const client: ActivityColumn = {
    accessorKey: 'client',
    size: 170,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Client')} />
    ),
    cell: ({ row }) => {
      const label = mcpClientDisplay.label({
        key: row.original.clientKey,
        clientName: null,
      });
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <ClientIcon
            icon={mcpClientDisplay.icon(row.original.clientKey)}
            className="size-6"
          />
          <TextWithTooltip tooltipMessage={label}>
            <div className="truncate font-medium">{label}</div>
          </TextWithTooltip>
        </div>
      );
    },
  };

  const member: ActivityColumn = {
    accessorKey: 'member',
    size: 170,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Member')} />
    ),
    cell: ({ row }) => {
      const { member: rowMember } = row.original;
      if (!rowMember) {
        return <MutedCell>{null}</MutedCell>;
      }
      const name = activityUtils.memberName(rowMember);
      return (
        <TextWithTooltip tooltipMessage={rowMember.email}>
          <MutedCell>
            {rowMember.id === currentUserId
              ? t('{name} · you', { name })
              : name}
          </MutedCell>
        </TextWithTooltip>
      );
    },
  };

  const ran: ActivityColumn = {
    accessorKey: 'ran',
    size: 280,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Ran')} />
    ),
    cell: ({ row }) => {
      const { action, piece } = activityUtils.formatRan({
        row: row.original,
        actionDisplayName: resolveActionDisplayName(row.original),
        pieceDisplayName: resolvePieceDisplayName(row.original),
      });
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          {row.original.pieceName !== null && (
            <PieceIcon
              logoUrl={resolvePieceLogoUrl(row.original)}
              displayName={resolvePieceDisplayName(row.original)}
              showTooltip={false}
              border
              size="sm"
            />
          )}
          <TextWithTooltip
            tooltipMessage={piece === null ? action : `${action} · ${piece}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{action}</span>
              {piece !== null && (
                <span className="truncate text-gray-11">{piece}</span>
              )}
            </div>
          </TextWithTooltip>
        </div>
      );
    },
  };

  const project: ActivityColumn = {
    accessorKey: 'project',
    size: 210,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Project')} />
    ),
    cell: ({ row }) => {
      const projectType = resolveProjectType(row.original);
      if (row.original.projectName === null) {
        return <MutedCell>{null}</MutedCell>;
      }
      return (
        <div className="flex min-w-0 items-baseline gap-1.5">
          <TextWithTooltip tooltipMessage={row.original.projectName}>
            <span className="min-w-0 truncate text-gray-12">
              {row.original.projectName}
            </span>
          </TextWithTooltip>
          {projectType === ProjectType.PERSONAL && (
            <span className="shrink-0 text-xs text-gray-11">
              {t('Personal')}
            </span>
          )}
        </div>
      );
    },
  };

  const result: ActivityColumn = {
    accessorKey: 'result',
    size: 130,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Result')} />
    ),
    cell: ({ row }) =>
      row.original.status === 'SUCCEEDED' ? (
        <StatusDot tone="success">{t('Succeeded')}</StatusDot>
      ) : (
        <StatusDot tone="danger">{t('Failed')}</StatusDot>
      ),
  };

  return [when, client, ...(showMember ? [member] : []), ran, project, result];
}

type ActivityColumn = ColumnDef<
  RowDataWithActions<PopulatedMcpActivity>,
  unknown
>;

type BuildActivityColumnsParams = {
  currentUserId: string | undefined;
  showMember: boolean;
  resolveActionDisplayName: (row: PopulatedMcpActivity) => string | undefined;
  resolvePieceDisplayName: (row: PopulatedMcpActivity) => string | undefined;
  resolvePieceLogoUrl: (row: PopulatedMcpActivity) => string | undefined;
  resolveProjectType: (row: PopulatedMcpActivity) => ProjectType | undefined;
};
