import { t } from 'i18next';
import {
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Copy,
  CornerUpLeft,
  Download,
  Folder,
  Loader2,
  MoreHorizontal,
  Pencil,
  Share2,
  Table2,
  Trash2,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';

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
import { LoadingSpinner } from '@/components/ui/spinner';
import { MoveToFolderDialog } from '@/features/automations/components/move-to-folder-dialog';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { ShareTemplateDialog } from '@/features/flows/components/share-template-dialog';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { FolderDto, PopulatedFlow, Table } from '@activepieces/shared';

import { TreeItem } from '../lib/types';

type AutomationsTableRowProps = {
  item: TreeItem;
  isSelected: boolean;
  isExpanded: boolean;
  isFolderLoading?: boolean;
  projectMembers: any;
  folders: FolderDto[];
  onRowClick: () => void;
  onToggleSelection: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: (flow: PopulatedFlow) => void;
  onMoveTo: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: Table) => void;
  isMoving: boolean;
  isDuplicating: boolean;
  onLoadMore?: () => void;
};

export const AutomationsTableRow = ({
  item,
  isSelected,
  isExpanded,
  isFolderLoading,
  folders,
  onToggleSelection,
  onRename,
  onDelete,
  onDuplicate,
  onMoveTo,
  onExportFlow,
  onExportTable,
  isMoving,
  isDuplicating,
  onLoadMore,
}: AutomationsTableRowProps) => {
  const { embedState } = useEmbedding();
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [moveFolderId, setMoveFolderId] = useState('');

  if (item.type === 'load-more-folder') {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-primary font-medium py-2">
        <div
          className="flex items-center gap-2 cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onLoadMore?.();
          }}
        >
          <ArrowDown className="h-4 w-4" />
          <span>
            {t('Load {count} more items...', { count: item.loadMoreCount })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="w-10 shrink-0 pl-2 pr-1 flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} />
      </div>
      <div className="flex-1 min-w-[200px] pl-6 pr-2 flex items-center">
        <div
          className="relative flex items-center gap-2 min-w-0"
          style={{ paddingLeft: item.depth * 24 }}
        >
          {item.type === 'folder' && (
            <span className="absolute -left-5 flex items-center justify-center w-5">
              {isFolderLoading ? (
                <Loader2 className="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </span>
          )}
          <span className="shrink-0">
            <RowItemIcon item={item} />
          </span>
          <span className="truncate">{item.name}</span>
        </div>
      </div>
      <div className="w-[200px] shrink-0 px-2 flex items-center">
        <RowItemDetails item={item} />
      </div>
      <div className="w-[180px] shrink-0 px-2 flex items-center">
        {item.data && (
          <FormattedDate
            date={new Date(item.data.updated)}
            className="text-left"
          />
        )}
      </div>
      {!embedState.isEmbedded && (
        <div className="w-[150px] shrink-0 px-2 flex items-center">
          <RowItemOwner item={item} />
        </div>
      )}
      <div
        className="w-[100px] shrink-0 px-2 flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'flow' && (
          <FlowStatusToggle flow={item.data as PopulatedFlow} />
        )}
      </div>
      <div
        className="w-[50px] shrink-0 px-2 flex items-center"
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

            {item.type === 'flow' && !embedState.hideDuplicateFlow && (
              <DropdownMenuItem
                onClick={() => onDuplicate(item.data as PopulatedFlow)}
                disabled={isDuplicating}
              >
                {isDuplicating ? (
                  <LoadingSpinner className="mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {isDuplicating ? t('Duplicating...') : t('Duplicate')}
              </DropdownMenuItem>
            )}

            {(item.type === 'flow' || item.type === 'table') &&
              !embedState.hideFolders && (
                <DropdownMenuItem
                  onClick={() => {
                    setMoveFolderId('');
                    setIsMoveOpen(true);
                  }}
                >
                  <CornerUpLeft className="h-4 w-4 mr-2" />
                  {t('Move To')}
                </DropdownMenuItem>
              )}

            {item.type === 'flow' && !embedState.hideExportAndImportFlow && (
              <DropdownMenuItem
                onClick={() => onExportFlow(item.data as PopulatedFlow)}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('Export')}
              </DropdownMenuItem>
            )}

            {item.type === 'table' && (
              <DropdownMenuItem
                onClick={() => onExportTable(item.data as Table)}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('Export')}
              </DropdownMenuItem>
            )}

            {item.type === 'flow' && !embedState.isEmbedded && (
              <ShareTemplateDialog
                flowId={item.id}
                flowVersionId={(item.data as PopulatedFlow).version.id}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('Share')}
                </DropdownMenuItem>
              </ShareTemplateDialog>
            )}

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

        <MoveToFolderDialog
          open={isMoveOpen}
          onOpenChange={setIsMoveOpen}
          folders={folders}
          selectedFolderId={moveFolderId}
          onFolderChange={setMoveFolderId}
          onConfirm={() => {
            onMoveTo(item, moveFolderId);
            setIsMoveOpen(false);
          }}
          isMoving={isMoving}
        />
      </div>
    </>
  );
};

const RowItemIcon = ({ item }: { item: TreeItem }) => {
  switch (item.type) {
    case 'folder':
      return <Folder className="h-4 w-4 text-gray-400 fill-gray-400" />;
    case 'flow':
      return <Workflow className="h-4 w-4 text-primary" />;
    default:
      return <Table2 className="h-4 w-4 text-emerald-500" />;
  }
};

const RowItemDetails = ({ item }: { item: TreeItem }) => {
  switch (item.type) {
    case 'folder':
      return (
        <span className="text-muted-foreground">
          {item.childCount} {item.childCount === 1 ? t('file') : t('files')}
        </span>
      );
    case 'flow': {
      const flow = item.data as PopulatedFlow;
      return (
        <PieceIconList
          trigger={flow.version.trigger}
          maxNumberOfIconsToShow={3}
          size="xs"
          circle={false}
        />
      );
    }
    default:
      return <span className="text-muted-foreground">-</span>;
  }
};

const RowItemOwner = ({ item }: { item: TreeItem }) => {
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
