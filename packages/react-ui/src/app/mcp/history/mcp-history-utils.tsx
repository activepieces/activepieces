import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  AlertCircle,
  CheckCircle2,
  Search,
  WorkflowIcon,
  Calendar,
  Copy,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DataTableFilter,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { formatUtils } from '@/lib/utils';
import { McpToolHistory, McpToolHistoryStatus } from '@activepieces/shared';

type McpToolHistoryWithActions = RowDataWithActions<McpToolHistory>;

export const getToolIcon = (item: McpToolHistory, metadata?: any[]) => {
  if ('flowId' in item.metadata) {
    return (
      <div className="dark:bg-accent-foreground/25 rounded-full bg-accent/35 p-2 border border-solid size-[36px]">
        <WorkflowIcon size={16} className="w-full h-full" strokeWidth={1.5} />
      </div>
    );
  }
  const piece = metadata?.find((m) => {
    if ('pieceName' in m && 'pieceName' in item.metadata) {
      return m.pieceName === item.metadata.pieceName;
    }
    return false;
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

export const getToolDisplayName = (item: McpToolHistory) => {
  if ('pieceName' in item.metadata) {
    return item.metadata.pieceName;
  }
  return 'Flow';
};

export const getActionName = (item: McpToolHistory) => {
  if ('actionName' in item.metadata) {
    return item.metadata.actionName;
  }
  return 'Flow Action';
};

export const getTooltipContent = (item: McpToolHistory) => {
  if ('pieceName' in item.metadata && 'pieceVersion' in item.metadata) {
    return `Piece Version: ${item.metadata.pieceVersion}`;
  }
  if ('flowId' in item.metadata)
    return `Flow Id: ${item.metadata.flowId} --- Flow Version: ${item.metadata.flowVersionId}`;
  return '';
};

export const copyToClipboard = async (
  text: string,
  fieldName: string,
  setCopiedField: (field: string | null) => void,
) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

export const formatJsonData = (data: any) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

export const createColumns = (
  metadata?: any[],
): ColumnDef<McpToolHistoryWithActions, unknown>[] => [
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
      return item.status === McpToolHistoryStatus.SUCCESS ? (
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

export const createFilters = (): DataTableFilter<keyof McpToolHistory>[] => [
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
        value: McpToolHistoryStatus.SUCCESS,
      },
      {
        label: t('Failed'),
        value: McpToolHistoryStatus.FAILED,
      },
    ],
  },
];

export const calculateStats = (historyItems?: { data: McpToolHistory[] }) => {
  if (!historyItems?.data) {
    return { total: 0, successful: 0, failed: 0 };
  }

  const total = historyItems.data.length;
  const successful = historyItems.data.filter(
    (item) => item.status === McpToolHistoryStatus.SUCCESS,
  ).length;
  const failed = total - successful;

  return { total, successful, failed };
};

export const renderCopyButton = (
  text: string,
  fieldName: string,
  copiedField: string | null,
  onCopy: (text: string, fieldName: string) => void,
) => (
  <Button variant="ghost" size="sm" onClick={() => onCopy(text, fieldName)}>
    {copiedField === fieldName ? (
      <Check className="h-3 w-3" />
    ) : (
      <Copy className="h-3 w-3" />
    )}
  </Button>
);
