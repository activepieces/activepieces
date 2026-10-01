import {
  FolderDto,
  PopulatedFlow,
  Table as ApTable,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowDown, ArrowUp, ArrowUpDown, LucideIcon } from 'lucide-react';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { AutomationsSort, SelectedItemsMap, TreeItem } from '../lib/types';
import { nextSort } from '../lib/utils';

import { AutomationsTableRow } from './automations-table-row';

export const AutomationsTable = ({
  items,
  isLoading,
  selectedItems,
  folders,
  showFolderName,
  selectableCount,
  isPinned,
  onTogglePin,
  onToggleAllSelection,
  onToggleItemSelection,
  onRowClick,
  onRenameItem,
  onDeleteItem,
  onDuplicateFlow,
  onMoveItem,
  onExportFlow,
  onExportTable,
  isMoving,
  isDuplicating,
  onLoadMoreInFolder,
  isItemSelected,
  sort,
  onSortChange,
}: AutomationsTableProps) => {
  const { embedState } = useEmbedding();
  const showOwner = !embedState.isEmbedded;
  const rows = items.filter((item) => item.type !== 'folder');
  const folderNames = new Map(
    folders.map((folder) => [folder.id, folder.displayName]),
  );
  const SortIcon = sortIcons[sort];
  const columnCount = showOwner ? 7 : 6;

  return (
    <div className="overflow-hidden rounded-2xl bg-panel shadow-edge">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                aria-label={t('Select all')}
                checked={
                  selectableCount > 0 && selectedItems.size === selectableCount
                }
                onCheckedChange={onToggleAllSelection}
              />
            </TableHead>
            <TableHead>
              <button
                type="button"
                aria-label={sortActionLabel(sort)}
                onClick={() => onSortChange(nextSort(sort))}
                className="flex items-center gap-1.5 rounded-md outline-hidden hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-accent-8"
              >
                {t('Name')}
                <SortIcon
                  className={cn(
                    'size-3.5',
                    sort === 'default' ? 'text-gray-9' : 'text-gray-12',
                  )}
                />
              </button>
            </TableHead>
            <TableHead className="hidden w-56 lg:table-cell">
              {t('Trigger')}
            </TableHead>
            {showOwner && (
              <TableHead className="hidden w-48 2xl:table-cell">
                {t('Owner')}
              </TableHead>
            )}
            <TableHead className="w-28 text-right">{t('Updated')}</TableHead>
            <TableHead className="w-24">
              <span className="sr-only">{t('Status')}</span>
            </TableHead>
            <TableHead className="w-12">
              <span className="sr-only">{t('Actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index} className="hover:bg-transparent">
                  <TableCell>
                    <Skeleton className="size-4 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-7 rounded-lg" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  {showOwner && (
                    <TableCell className="hidden 2xl:table-cell">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-9 rounded-full" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            : rows.map((item) => (
                <AutomationsTableRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  columnCount={columnCount}
                  showOwner={showOwner}
                  folderName={
                    showFolderName && item.folderId
                      ? folderNames.get(item.folderId) ?? null
                      : null
                  }
                  isSelected={isItemSelected(item)}
                  isPinned={isPinned(item.id)}
                  folders={folders}
                  onRowClick={(ctrlKey) => onRowClick(item, ctrlKey)}
                  onToggleSelection={() => onToggleItemSelection(item)}
                  onTogglePin={() => onTogglePin(item.id)}
                  onRename={() => onRenameItem(item)}
                  onDelete={() => onDeleteItem(item)}
                  onDuplicate={onDuplicateFlow}
                  onMoveTo={onMoveItem}
                  onExportFlow={onExportFlow}
                  onExportTable={onExportTable}
                  isMoving={isMoving}
                  isDuplicating={isDuplicating}
                  onLoadMore={
                    item.type === 'load-more-folder' && item.folderId
                      ? () => onLoadMoreInFolder(item.folderId!)
                      : undefined
                  }
                />
              ))}
        </TableBody>
      </Table>
    </div>
  );
};

function sortActionLabel(sort: AutomationsSort): string {
  switch (sort) {
    case 'default':
      return t('Sort by name A to Z');
    case 'name-asc':
      return t('Sort by name Z to A');
    case 'name-desc':
      return t('Clear name sorting');
  }
}

const sortIcons: Record<AutomationsSort, LucideIcon> = {
  default: ArrowUpDown,
  'name-asc': ArrowUp,
  'name-desc': ArrowDown,
};

type AutomationsTableProps = {
  items: TreeItem[];
  isLoading: boolean;
  selectedItems: SelectedItemsMap;
  folders: FolderDto[];
  showFolderName: boolean;
  selectableCount: number;
  isPinned: (itemId: string) => boolean;
  onTogglePin: (itemId: string) => void;
  onToggleAllSelection: () => void;
  onToggleItemSelection: (item: TreeItem) => void;
  onRowClick: (item: TreeItem, ctrlKey?: boolean) => void;
  onRenameItem: (item: TreeItem) => void;
  onDeleteItem: (item: TreeItem) => void;
  onDuplicateFlow: (flow: PopulatedFlow) => void;
  onMoveItem: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: ApTable) => void;
  isMoving: boolean;
  isDuplicating: boolean;
  onLoadMoreInFolder: (folderId: string) => void;
  isItemSelected: (item: TreeItem) => boolean;
  sort: AutomationsSort;
  onSortChange: (sort: AutomationsSort) => void;
};
