import {
  FlowTriggerType,
  FolderDto,
  PopulatedFlow,
  Table,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Copy,
  Download,
  FolderInput,
  MoreHorizontal,
  Pencil,
  Share2,
  Star,
  Table2,
  Trash2,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { FormattedDate } from '@/components/custom/formatted-date';
import { LogoPlate } from '@/components/custom/logo-plate';
import { LoadingSpinner } from '@/components/custom/spinner';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { MoveToFolderDialog } from '@/features/automations/components/move-to-folder-dialog';
import { FlowCreatedByBadge } from '@/features/flows/components/flow-created-by-badge';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { ShareTemplateDialog } from '@/features/flows/components/share-template-dialog';
import { piecesHooks } from '@/features/pieces';

import { TreeItem } from '../lib/types';

export const AutomationsTableRow = ({
  item,
  columnCount,
  showOwner,
  folderName,
  isSelected,
  isPinned,
  folders,
  onRowClick,
  onToggleSelection,
  onTogglePin,
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [moveFolderId, setMoveFolderId] = useState('');

  if (item.type === 'load-more-folder') {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={columnCount}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onLoadMore?.();
            }}
          >
            {folderName
              ? t('Show {count} more in {folder}', {
                  count: item.loadMoreCount,
                  folder: folderName,
                })
              : t('Show {count} more', { count: item.loadMoreCount })}
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  const flow = isFlowItem(item) ? item.data : null;
  const table = isTableItem(item) ? item.data : null;

  return (
    <TableRow
      data-state={isSelected ? 'selected' : undefined}
      className="cursor-pointer"
      onClick={(e) => onRowClick(e.ctrlKey || e.metaKey)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          aria-label={t('Select {name}', { name: item.name })}
          checked={isSelected}
          onCheckedChange={onToggleSelection}
        />
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-3 text-gray-11 [&_svg]:size-4">
            {flow ? <Workflow /> : <Table2 />}
          </span>
          <div className="flex min-w-0 items-baseline gap-2">
            <TextWithTooltip tooltipMessage={item.name}>
              <span className="max-w-full shrink-0 truncate font-medium text-gray-12">
                {item.name}
              </span>
            </TextWithTooltip>
            {folderName && (
              <span className="min-w-0 truncate text-gray-11">
                {folderName}
              </span>
            )}
          </div>
          {isPinned && (
            <Star
              aria-label={t('Favorite')}
              className="size-3.5 shrink-0 fill-swatch-6-mark text-swatch-6-mark"
            />
          )}
          {flow && <FlowCreatedByBadge createdBy={flow.createdBy} />}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {flow ? <TriggerCell flow={flow} /> : <Muted>—</Muted>}
      </TableCell>
      {showOwner && (
        <TableCell className="hidden 2xl:table-cell">
          {flow?.ownerId ? (
            <ApAvatar
              id={flow.ownerId}
              includeAvatar={true}
              includeName={true}
              size="small"
            />
          ) : (
            <Muted>—</Muted>
          )}
        </TableCell>
      )}
      <TableCell className="text-right">
        {item.data && (
          <FormattedDate
            date={new Date(item.data.updated)}
            className="text-gray-11 tabular-nums"
          />
        )}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {flow && <FlowStatusToggle flow={flow} />}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('Actions for {name}', { name: item.name })}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onRename}>
                <Pencil />
                {t('Rename')}
              </DropdownMenuItem>
              {flow && !embedState.hideDuplicateFlow && (
                <DropdownMenuItem
                  onClick={() => onDuplicate(flow)}
                  disabled={isDuplicating}
                >
                  {isDuplicating ? <LoadingSpinner /> : <Copy />}
                  {t('Duplicate')}
                </DropdownMenuItem>
              )}
              {!embedState.hideFolders && (
                <DropdownMenuItem
                  onClick={() => {
                    setMoveFolderId('');
                    setIsMoveOpen(true);
                  }}
                >
                  <FolderInput />
                  {t('Move to folder')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onTogglePin}>
                <Star />
                {isPinned ? t('Remove from favorites') : t('Add to favorites')}
              </DropdownMenuItem>
              {flow && !embedState.hideExportAndImportFlow && (
                <DropdownMenuItem onClick={() => onExportFlow(flow)}>
                  <Download />
                  {t('Export')}
                </DropdownMenuItem>
              )}
              {table && (
                <DropdownMenuItem onClick={() => onExportTable(table)}>
                  <Download />
                  {t('Export')}
                </DropdownMenuItem>
              )}
              {flow && !embedState.isEmbedded && (
                <ShareTemplateDialog
                  flowId={flow.id}
                  flowVersionId={flow.version.id}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Share2 />
                    {t('Share as template')}
                  </DropdownMenuItem>
                </ShareTemplateDialog>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setIsDeleteOpen(true)}
              >
                <Trash2 />
                {t('Delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ConfirmDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title={t('Delete {name}?', { name: item.name })}
          description={t('Deleting "{name}" cannot be undone.', {
            name: item.name,
          })}
          onConfirm={async () => onDelete()}
          confirmLabel={t('Delete')}
        />
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
      </TableCell>
    </TableRow>
  );
};

const TriggerCell = ({ flow }: { flow: PopulatedFlow }) => {
  const trigger = flow.version.trigger;
  const pieceName =
    trigger.type === FlowTriggerType.PIECE ? trigger.settings.pieceName : '';
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });

  if (trigger.type !== FlowTriggerType.PIECE) {
    return <Muted>{t('No trigger yet')}</Muted>;
  }

  const label = summary?.displayName
    ? `${summary.displayName} · ${trigger.displayName}`
    : trigger.displayName;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <LogoPlate
        src={summary?.logoUrl}
        alt={summary?.displayName ?? ''}
        size="xxs"
        className="rounded-md"
      />
      <TextWithTooltip tooltipMessage={label}>
        <span className="truncate text-gray-11">{label}</span>
      </TextWithTooltip>
    </div>
  );
};

const Muted = ({ children }: { children: React.ReactNode }) => (
  <span className="text-gray-11">{children}</span>
);

function isFlowItem(
  item: TreeItem,
): item is Omit<TreeItem, 'data'> & { data: PopulatedFlow } {
  return item.type === 'flow';
}

function isTableItem(
  item: TreeItem,
): item is Omit<TreeItem, 'data'> & { data: Table } {
  return item.type === 'table';
}

type AutomationsTableRowProps = {
  item: TreeItem;
  columnCount: number;
  showOwner: boolean;
  folderName: string | null;
  isSelected: boolean;
  isPinned: boolean;
  folders: FolderDto[];
  onRowClick: (ctrlKey: boolean) => void;
  onToggleSelection: () => void;
  onTogglePin: () => void;
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
