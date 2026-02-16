import { t } from 'i18next';
import {
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Folder,
  Loader2,
  MoreHorizontal,
  Pencil,
  Table2,
  Trash2,
  Workflow,
} from 'lucide-react';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormattedDate } from '@/components/ui/formatted-date';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { PopulatedFlow } from '@activepieces/shared';

import { TreeItem } from '../lib/types';

type AutomationsTableRowProps = {
  item: TreeItem;
  isSelected: boolean;
  isExpanded: boolean;
  isFolderLoading?: boolean;
  projectMembers: any;
  onRowClick: () => void;
  onToggleSelection: () => void;
  onRename: () => void;
  onDelete: () => void;
  onLoadMore?: () => void;
};

export const AutomationsTableRow = ({
  item,
  isSelected,
  isExpanded,
  isFolderLoading,
  onRowClick,
  onToggleSelection,
  onRename,
  onDelete,
  onLoadMore,
}: AutomationsTableRowProps) => {
  const { embedState } = useEmbedding();

  if (item.type === 'load-more-folder') {
    return (
      <>
        <td></td>
        <td colSpan={6}>
          <div
            className="flex items-center justify-center gap-2 text-primary font-medium py-2 cursor-pointer hover:underline"
            onClick={onLoadMore}
          >
            <ArrowDown className="h-4 w-4" />
            <span>
              {t('Load {count} more items...', { count: item.loadMoreCount })}
            </span>
          </div>
        </td>
      </>
    );
  }

  const getItemIcon = () => {
    if (item.type === 'folder') {
      return (
        <Folder className="h-4 w-4 text-muted-foreground fill-muted-foreground" />
      );
    }
    if (item.type === 'flow') {
      return <Workflow className="h-4 w-4 text-primary" />;
    }
    return <Table2 className="h-4 w-4 text-emerald-500" />;
  };

  const getItemDetails = () => {
    if (item.type === 'folder') {
      return (
        <span className="text-muted-foreground">
          {item.childCount} {item.childCount === 1 ? t('file') : t('files')}
        </span>
      );
    }
    if (item.type === 'flow') {
      const flow = item.data as PopulatedFlow;
      return (
        <PieceIconList
          trigger={flow.version.trigger}
          maxNumberOfIconsToShow={3}
          size="sm"
          circle={false}
        />
      );
    }
    if (item.type === 'table') {
      return <span className="text-muted-foreground">-</span>;
    }
    return null;
  };

  const renderOwnerCell = () => {
    if (item.type === 'flow') {
      const flow = item.data as PopulatedFlow;
      if (flow.ownerId) {
        return (
          <ApAvatar
            id={flow.ownerId}
            includeAvatar={true}
            includeName={true}
            size="small"
          />
        );
      }
    }
    return <span className="text-muted-foreground">-</span>;
  };

  return (
    <>
      <td
        className="pl-2 pr-1 py-1.5 align-middle w-[40px]"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} />
      </td>
      <td className="pl-1 pr-2 py-1.5 align-middle">
        <div className="flex items-center">
          <div className="w-5 shrink-0 flex items-center justify-center">
            {item.type === 'folder' &&
              (isFolderLoading ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ))}
          </div>
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: item.depth * 24 }}
          >
            {getItemIcon()}
            <span className="truncate">{item.name}</span>
          </div>
        </div>
      </td>
      {!embedState.isEmbedded && (
        <td className="px-2 py-1.5 align-middle">{getItemDetails()}</td>
      )}
      <td className="px-2 py-1.5 align-middle">
        {item.data && (
          <FormattedDate
            date={new Date(item.data.updated)}
            className="text-left"
          />
        )}
      </td>
      <td className="px-2 py-1.5 align-middle">{renderOwnerCell()}</td>
      <td
        className="px-2 py-1.5 align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'flow' && (
          <FlowStatusToggle flow={item.data as PopulatedFlow} />
        )}
      </td>
      <td
        className="px-2 py-1.5 align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('Rename')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ConfirmationDeleteDialog
              title={t('Delete {type}', { type: item.type })}
              message={t(
                'Are you sure you want to delete "{name}"? This action cannot be undone.',
                { name: item.name },
              )}
              mutationFn={async () => onDelete()}
              entityName={item.type}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('Delete')}
              </DropdownMenuItem>
            </ConfirmationDeleteDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </>
  );
};
