import { t } from 'i18next';
import {
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
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
import { TableCell, TableRow } from '@/components/ui/table';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { cn } from '@/lib/utils';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { PopulatedFlow } from '@activepieces/shared';

import { TreeItem } from '../lib/types';

type AutomationsTableRowProps = {
  item: TreeItem;
  isSelected: boolean;
  isExpanded: boolean;
  projectMembers: ProjectMemberWithUser[] | undefined;
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
  onRowClick,
  onToggleSelection,
  onRename,
  onDelete,
  onLoadMore,
}: AutomationsTableRowProps) => {
  const { embedState } = useEmbedding();

  if (item.type === 'load-more-folder' || item.type === 'load-more-root') {
    return (
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={onLoadMore}
      >
        <TableCell></TableCell>
        <TableCell colSpan={6}>
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <ArrowDown className="h-4 w-4" />
            <span>
              {t('Load {count} more items...', { count: item.loadMoreCount })}
            </span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  const getItemIcon = () => {
    if (item.type === 'folder') {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-amber-500" />
      ) : (
        <Folder className="h-4 w-4 text-amber-500" />
      );
    }
    if (item.type === 'flow') {
      return <Workflow className="h-4 w-4 text-purple-500" />;
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
      const ownerId = flow.ownerId;

      if (ownerId) {
        return (
          <div className="text-left">
            {ownerId && (
              <ApAvatar
                id={ownerId}
                includeAvatar={true}
                includeName={true}
                size="small"
              />
            )}
            {!ownerId && <div className="text-left">-</div>}
          </div>
        );
      }
    }
    return <span className="text-muted-foreground">-</span>;
  };

  return (
    <TableRow className="cursor-pointer group" onClick={onRowClick}>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} />
      </TableCell>
      <TableCell>
        <div
          className={cn(
            'flex items-center gap-2',
          )}
          style={{ paddingLeft: item.depth * 24 }}
        >
          {item.type === 'folder' && (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
          {getItemIcon()}
          <span className="truncate">{item.name}</span>
        </div>
      </TableCell>
      {!embedState.isEmbedded && <TableCell>{getItemDetails()}</TableCell>}
      <TableCell>
        {item.data && (
          <FormattedDate
            date={new Date(item.data.updated)}
            className="text-left"
          />
        )}
      </TableCell>
      <TableCell>{renderOwnerCell()}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {item.type === 'flow' && (
          <FlowStatusToggle flow={item.data as PopulatedFlow} />
        )}
      </TableCell>
      <TableCell
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center"
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
      </TableCell>
    </TableRow>
  );
};
