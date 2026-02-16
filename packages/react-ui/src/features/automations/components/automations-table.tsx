import { t } from 'i18next';
import { AnimatePresence, motion } from 'motion/react';

import { useEmbedding } from '@/components/embed-provider';
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
import { ProjectMemberWithUser } from '@activepieces/ee-shared';

import { TreeItem } from '../lib/types';

import { AutomationsTableRow } from './automations-table-row';

type AutomationsTableProps = {
  items: TreeItem[];
  isLoading: boolean;
  selectedItems: Set<string>;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  projectMembers: ProjectMemberWithUser[] | undefined;
  selectableCount: number;
  onToggleAllSelection: () => void;
  onToggleItemSelection: (item: TreeItem) => void;
  onRowClick: (item: TreeItem) => void;
  onRenameItem: (item: TreeItem) => void;
  onDeleteItem: (item: TreeItem) => void;
  onLoadMoreInFolder: (folderId: string) => void;
  isItemSelected: (item: TreeItem) => boolean;
};

export const AutomationsTable = ({
  items,
  isLoading,
  selectedItems,
  expandedFolders,
  loadingFolders,
  projectMembers,
  selectableCount,
  onToggleAllSelection,
  onToggleItemSelection,
  onRowClick,
  onRenameItem,
  onDeleteItem,
  onLoadMoreInFolder,
  isItemSelected,
}: AutomationsTableProps) => {
  const { embedState } = useEmbedding();

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px] pl-2 pr-1">
              <Checkbox
                checked={
                  selectableCount > 0 && selectedItems.size === selectableCount
                }
                onCheckedChange={onToggleAllSelection}
              />
            </TableHead>
            <TableHead className="w-[350px] pl-1">{t('Name')}</TableHead>
            {!embedState.isEmbedded && (
              <TableHead className="w-[200px]">{t('Details')}</TableHead>
            )}
            <TableHead className="w-[200px]">{t('Last modified')}</TableHead>
            <TableHead className="w-[150px]">{t('Owner')}</TableHead>
            <TableHead className="w-[100px]">{t('Status')}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <Skeleton className="h-9 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <AnimatePresence initial={false}>
              {items.map((item) =>
                item.depth === 1 ? (
                  <motion.tr
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="border-b cursor-pointer hover:bg-muted/50"
                    onClick={() => onRowClick(item)}
                  >
                    <AutomationsTableRow
                      item={item}
                      isSelected={isItemSelected(item)}
                      isExpanded={false}
                      projectMembers={projectMembers}
                      onRowClick={() => onRowClick(item)}
                      onToggleSelection={() => onToggleItemSelection(item)}
                      onRename={() => onRenameItem(item)}
                      onDelete={() => onDeleteItem(item)}
                      onLoadMore={
                        item.type === 'load-more-folder'
                          ? () => onLoadMoreInFolder(item.folderId!)
                          : undefined
                      }
                    />
                  </motion.tr>
                ) : (
                  <TableRow
                    key={`${item.type}-${item.id}`}
                    className="cursor-pointer"
                    onClick={() => onRowClick(item)}
                  >
                    <AutomationsTableRow
                      item={item}
                      isSelected={isItemSelected(item)}
                      isExpanded={expandedFolders.has(item.id)}
                      isFolderLoading={loadingFolders.has(item.id)}
                      projectMembers={projectMembers}
                      onRowClick={() => onRowClick(item)}
                      onToggleSelection={() => onToggleItemSelection(item)}
                      onRename={() => onRenameItem(item)}
                      onDelete={() => onDeleteItem(item)}
                      onLoadMore={undefined}
                    />
                  </TableRow>
                ),
              )}
            </AnimatePresence>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
