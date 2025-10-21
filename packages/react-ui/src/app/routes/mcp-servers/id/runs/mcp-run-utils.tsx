import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckCircle2, Search, WorkflowIcon, X, Check } from 'lucide-react';

import {
  DataTableFilters,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { StepMetadataWithSuggestions } from '@/lib/types';
import { formatUtils } from '@/lib/utils';
import { McpRun, McpRunStatus } from '@activepieces/shared';

const getToolIcon = (
  item: McpRun,
  metadata?: StepMetadataWithSuggestions[],
) => {
  if ('flowId' in item.metadata) {
    return (
      <div className="dark:bg-accent-foreground/25 rounded-full bg-accent/35 p-2 border border-solid size-[36px]">
        <WorkflowIcon size={16} className="w-full h-full" strokeWidth={1.5} />
      </div>
    );
  }
  const piece = metadata?.find((m) => {
    return (
      'pieceName' in m &&
      'pieceName' in item.metadata &&
      m.pieceName === item.metadata.pieceName
    );
  });
  if (piece) {
    return (
      <PieceIcon
        displayName={piece.displayName}
        logoUrl={piece.logoUrl}
        size={'md'}
        border={true}
        showTooltip={true}
        circle={true}
      />
    );
  }
  return null;
};

const getToolDisplayName = (item: McpRun) => {
  if ('pieceName' in item.metadata) {
    return item.metadata.pieceName;
  }
  return t('Flow');
};

const getActionName = (item: McpRun) => {
  if ('actionName' in item.metadata) {
    return item.metadata.actionName;
  }
  if ('name' in item.metadata) {
    return item.metadata.name;
  }
  return t('Tool Action');
};

const getTooltipContent = (item: McpRun) => {
  if ('pieceName' in item.metadata && 'pieceVersion' in item.metadata) {
    return `${t('Piece Version')}: ${item.metadata.pieceVersion}`;
  }
  if ('flowId' in item.metadata)
    return `${t('Flow Id')}: ${item.metadata.flowId} --- ${t(
      'Flow Version',
    )}: ${item.metadata.flowVersionId}`;
  return '';
};

export const mcpRunUtils = {
  getToolIcon,
  getToolDisplayName,
  getActionName,
  getTooltipContent,
};

export const mcpRunColumns = (
  metadata: StepMetadataWithSuggestions[],
): ColumnDef<RowDataWithActions<McpRun>>[] => [
  {
    accessorKey: 'metadata',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Action')} />
    ),
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">{getToolIcon(item, metadata)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate">
                {getActionName(item)}
              </p>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {getToolDisplayName(item)}
              </span>
            </div>
          </div>
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
      const status = row.original.status;
      return (
        <div className="text-left">
          <StatusIconWithText
            icon={status === McpRunStatus.SUCCESS ? Check : X}
            text={formatUtils.convertEnumToHumanReadable(status)}
            variant={status === McpRunStatus.SUCCESS ? 'success' : 'error'}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Created At')} />
    ),
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-2 text-sm">
          <span>{formatUtils.formatDate(new Date(item.created))}</span>
        </div>
      );
    },
  },
];

export const mcpRunFilters = (): DataTableFilters<keyof McpRun>[] => [
  {
    type: 'input',
    title: t('Action Name'),
    accessorKey: 'metadata',
    icon: Search,
  },
  {
    type: 'select',
    title: t('Status'),
    accessorKey: 'status',
    icon: CheckCircle2,
    options: [
      {
        label: t('Success'),
        value: McpRunStatus.SUCCESS,
      },
      {
        label: t('Failed'),
        value: McpRunStatus.FAILED,
      },
    ],
  },
];
