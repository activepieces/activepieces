import { t } from 'i18next';

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
  projectMembers: ProjectMemberWithUser[] | undefined;
  onToggleAllSelection: () => void;
  onToggleItemSelection: (item: TreeItem) => void;
  onRowClick: (item: TreeItem) => void;
  onRenameItem: (item: TreeItem) => void;
  onDeleteItem: (item: TreeItem) => void;
  onLoadMoreInFolder?: (folderId: string) => void;
  onLoadMoreRoot?: () => void;
  isItemSelected?: (item: TreeItem) => boolean;
};

export const AutomationsTable = ({
  items,
  isLoading,
  selectedItems,
  expandedFolders,
  projectMembers,
  onToggleAllSelection,
  onToggleItemSelection,
  onRowClick,
  onRenameItem,
  onDeleteItem,
  onLoadMoreInFolder,
  onLoadMoreRoot,
  isItemSelected,
}: AutomationsTableProps) => {
  const selectableItems = items.filter(
    (item) =>
      item.type !== 'load-more-folder' && item.type !== 'load-more-root',
  );
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px]">
              <Checkbox
                checked={
                  selectableItems.length > 0 &&
                  selectedItems.size === selectableItems.length
                }
                onCheckedChange={onToggleAllSelection}
              />
            </TableHead>
            <TableHead className="w-[350px]">{t('Name')}</TableHead>
            <TableHead className="w-[200px]">{t('Details')}</TableHead>
            <TableHead className="w-[200px]">{t('Last modified')}</TableHead>
            <TableHead className="w-[150px]">{t('Owner')}</TableHead>
            <TableHead className="w-[100px]">{t('Status')}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                </TableRow>
              ))
            : items.map((item) => (
                <AutomationsTableRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  isSelected={
                    isItemSelected
                      ? isItemSelected(item)
                      : selectedItems.has(`${item.type}-${item.id}`)
                  }
                  isExpanded={expandedFolders.has(item.id)}
                  projectMembers={projectMembers}
                  onRowClick={() => onRowClick(item)}
                  onToggleSelection={() => onToggleItemSelection(item)}
                  onRename={() => onRenameItem(item)}
                  onDelete={() => onDeleteItem(item)}
                  onLoadMore={
                    item.type === 'load-more-folder'
                      ? () => onLoadMoreInFolder?.(item.folderId!)
                      : item.type === 'load-more-root'
                      ? () => onLoadMoreRoot?.()
                      : undefined
                  }
                />
              ))}
        </TableBody>
      </Table>
    </div>
  );
};
