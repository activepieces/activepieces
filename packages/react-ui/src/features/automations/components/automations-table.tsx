import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { t } from 'i18next';
import React from 'react';

import { useEmbedding } from '@/components/embed-provider';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { FolderDto, PopulatedFlow, Table } from '@activepieces/shared';

import { TreeItem } from '../lib/types';
import { groupTreeItemsByFolder } from '../lib/utils';

import { AutomationsTableRow } from './automations-table-row';

type AutomationsTableProps = {
  items: TreeItem[];
  isLoading: boolean;
  selectedItems: Set<string>;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  projectMembers: ProjectMemberWithUser[] | undefined;
  folders: FolderDto[];
  selectableCount: number;
  onToggleAllSelection: () => void;
  onToggleItemSelection: (item: TreeItem) => void;
  onRowClick: (item: TreeItem) => void;
  onRenameItem: (item: TreeItem) => void;
  onDeleteItem: (item: TreeItem) => void;
  onDuplicateFlow: (flow: PopulatedFlow) => void;
  onMoveItem: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: Table) => void;
  isMoving: boolean;
  isDuplicating: boolean;
  onLoadMoreInFolder: (folderId: string) => void;
  isItemSelected: (item: TreeItem) => boolean;
};

const rowClassName =
  'flex items-center min-h-[48px] py-2 text-sm cursor-pointer hover:bg-muted/50';

export const AutomationsTable = ({
  items,
  isLoading,
  selectedItems,
  expandedFolders,
  loadingFolders,
  projectMembers,
  folders,
  selectableCount,
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
}: AutomationsTableProps) => {
  const { embedState } = useEmbedding();
  const groups = groupTreeItemsByFolder(items);

  return (
    <div className="rounded-md border overflow-x-auto">
      <div className="min-w-[1000px]">
        <div className="flex items-center h-10 text-sm border-b font-medium text-muted-foreground">
          <div className="w-10 shrink-0 pl-2 pr-1">
            <Checkbox
              checked={
                selectableCount > 0 && selectedItems.size === selectableCount
              }
              onCheckedChange={onToggleAllSelection}
            />
          </div>
          <div className="flex-1 min-w-[200px] pl-6">{t('Name')}</div>
          {!embedState.isEmbedded && (
            <div className="w-[200px] shrink-0 px-2">{t('Details')}</div>
          )}
          <div className="w-[180px] shrink-0 px-2">{t('Last modified')}</div>
          <div className="w-[150px] shrink-0 px-2">{t('Owner')}</div>
          <div className="w-[100px] shrink-0 px-2">{t('Status')}</div>
          <div className="w-[50px] shrink-0 px-2"></div>
        </div>

        {isLoading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center h-10 px-2">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <AccordionPrimitive.Root
            type="multiple"
            value={Array.from(expandedFolders)}
          >
            {groups.map((group) => {
              const isFolder = group.item.type === 'folder';

              if (isFolder) {
                return (
                  <AccordionPrimitive.Item
                    key={`folder-${group.item.id}`}
                    value={group.item.id}
                    className="not-last:border-b"
                  >
                    <div
                      className={cn(rowClassName)}
                      onClick={() => onRowClick(group.item)}
                    >
                      <AutomationsTableRow
                        item={group.item}
                        isSelected={isItemSelected(group.item)}
                        isExpanded={expandedFolders.has(group.item.id)}
                        isFolderLoading={loadingFolders.has(group.item.id)}
                        projectMembers={projectMembers}
                        folders={folders}
                        onRowClick={() => onRowClick(group.item)}
                        onToggleSelection={() =>
                          onToggleItemSelection(group.item)
                        }
                        onRename={() => onRenameItem(group.item)}
                        onDelete={() => onDeleteItem(group.item)}
                        onDuplicate={onDuplicateFlow}
                        onMoveTo={onMoveItem}
                        onExportFlow={onExportFlow}
                        onExportTable={onExportTable}
                        isMoving={isMoving}
                        isDuplicating={isDuplicating}
                        onLoadMore={undefined}
                      />
                    </div>
                    <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                      {group.children.map((child) => (
                        <div
                          key={`${child.type}-${child.id}`}
                          className={cn(rowClassName, 'border-t')}
                          onClick={() => onRowClick(child)}
                        >
                          <AutomationsTableRow
                            item={child}
                            isSelected={isItemSelected(child)}
                            isExpanded={false}
                            projectMembers={projectMembers}
                            folders={folders}
                            onRowClick={() => onRowClick(child)}
                            onToggleSelection={() =>
                              onToggleItemSelection(child)
                            }
                            onRename={() => onRenameItem(child)}
                            onDelete={() => onDeleteItem(child)}
                            onDuplicate={onDuplicateFlow}
                            onMoveTo={onMoveItem}
                            onExportFlow={onExportFlow}
                            onExportTable={onExportTable}
                            isMoving={isMoving}
                            isDuplicating={isDuplicating}
                            onLoadMore={
                              child.type === 'load-more-folder'
                                ? () => onLoadMoreInFolder(child.folderId!)
                                : undefined
                            }
                          />
                        </div>
                      ))}
                    </AccordionPrimitive.Content>
                  </AccordionPrimitive.Item>
                );
              }

              return (
                <div
                  key={`${group.item.type}-${group.item.id}`}
                  className={cn(rowClassName, 'not-last:border-b')}
                  onClick={() => onRowClick(group.item)}
                >
                  <AutomationsTableRow
                    item={group.item}
                    isSelected={isItemSelected(group.item)}
                    isExpanded={false}
                    projectMembers={projectMembers}
                    folders={folders}
                    onRowClick={() => onRowClick(group.item)}
                    onToggleSelection={() => onToggleItemSelection(group.item)}
                    onRename={() => onRenameItem(group.item)}
                    onDelete={() => onDeleteItem(group.item)}
                    onDuplicate={onDuplicateFlow}
                    onMoveTo={onMoveItem}
                    onExportFlow={onExportFlow}
                    onExportTable={onExportTable}
                    isMoving={isMoving}
                    isDuplicating={isDuplicating}
                    onLoadMore={undefined}
                  />
                </div>
              );
            })}
          </AccordionPrimitive.Root>
        )}
      </div>
    </div>
  );
};
