import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  AlertCircle,
  CheckCircle2,
  Search,
  WorkflowIcon,
  Calendar,
} from 'lucide-react';

import {
  DataTableFilter,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { StepMetadataWithSuggestions } from '@/features/pieces/lib/types';
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
      const item = row.original;
      return item.status === McpRunStatus.SUCCESS ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700">
          <CheckCircle2 className="h-3 w-3" />
          <span className="text-xs font-medium">{t('Success')}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs font-medium">{t('Failed')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Date Created')} />
    ),
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatUtils.formatDate(new Date(item.created))}</span>
        </div>
      );
    },
  },
];

export const mcpRunFilters = (): DataTableFilter<keyof McpRun>[] => [
  {
    type: 'input',
    title: t('Action Name'),
    accessorKey: 'metadata',
    icon: Search,
    options: [],
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
