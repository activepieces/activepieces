import { PopulatedMcpActivity } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Check, Clock, FolderOpen, Plug, User, Wrench, X } from 'lucide-react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';

import { ClientIcon } from '../client-icon';
import { mcpClientDisplay } from '../mcp-client-display';

import { activityUtils } from './activity-utils';

export function buildActivityColumns({
  currentUserId,
  showMember,
  resolveActionDisplayName,
  resolvePieceDisplayName,
}: BuildActivityColumnsParams): ActivityColumn[] {
  const when: ActivityColumn = {
    accessorKey: 'created',
    size: 150,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('When')} icon={Clock} />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {activityUtils.formatWhen(row.original.created)}
      </div>
    ),
  };

  const client: ActivityColumn = {
    accessorKey: 'clientKey',
    size: 170,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Client')} icon={Plug} />
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
      <DataTableColumnHeader column={column} title={t('Member')} icon={User} />
    ),
    cell: ({ row }) => {
      const { member: rowMember } = row.original;
      if (!rowMember) {
        return <div className="text-muted-foreground">—</div>;
      }
      const name = `${rowMember.firstName} ${rowMember.lastName}`.trim();
      return (
        <TextWithTooltip tooltipMessage={rowMember.email}>
          <div className="truncate text-muted-foreground">
            {rowMember.id === currentUserId
              ? t('{name} · you', { name })
              : name}
          </div>
        </TextWithTooltip>
      );
    },
  };

  const ran: ActivityColumn = {
    accessorKey: 'ran',
    size: 280,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Ran')} icon={Wrench} />
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
            <PieceIconWithPieceName
              pieceName={row.original.pieceName}
              showTooltip={false}
              size="sm"
            />
          )}
          <TextWithTooltip
            tooltipMessage={piece === null ? action : `${action} · ${piece}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{action}</span>
              {piece !== null && (
                <span className="truncate text-muted-foreground">{piece}</span>
              )}
            </div>
          </TextWithTooltip>
        </div>
      );
    },
  };

  const project: ActivityColumn = {
    accessorKey: 'project',
    size: 150,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Project')}
        icon={FolderOpen}
      />
    ),
    cell: ({ row }) =>
      row.original.projectName === null ? (
        <div className="text-muted-foreground">—</div>
      ) : (
        <Badge variant="outline" className="font-normal">
          {row.original.projectName}
        </Badge>
      ),
  };

  const result: ActivityColumn = {
    accessorKey: 'status',
    size: 130,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Result')} />
    ),
    cell: ({ row }) =>
      row.original.status === 'SUCCEEDED' ? (
        <StatusIconWithText
          icon={Check}
          text={t('Succeeded')}
          variant="success"
        />
      ) : (
        <StatusIconWithText icon={X} text={t('Failed')} variant="error" />
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
};
