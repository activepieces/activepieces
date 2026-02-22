import { useCallback, useMemo, useState } from 'react';

import {
  SelectableItemType,
  SelectedItemsMap,
  TreeItem,
} from '../lib/types';
import { getItemKey } from '../lib/utils';

export function useAutomationsSelection(treeItems: TreeItem[]) {
  const [selectedItems, setSelectedItems] = useState<SelectedItemsMap>(
    new Map(),
  );

  const childrenByFolder = useMemo(() => {
    const map = new Map<string, TreeItem[]>();
    treeItems.forEach((item) => {
      if (item.folderId && item.type !== 'load-more-folder') {
        const list = map.get(item.folderId) ?? [];
        list.push(item);
        map.set(item.folderId, list);
      }
    });
    return map;
  }, [treeItems]);

  const toggleItemSelection = useCallback(
    (item: TreeItem) => {
      const key = getItemKey(item);
      setSelectedItems((prev) => {
        const next = new Map(prev);

        if (item.type === 'folder') {
          const children = childrenByFolder.get(item.id) ?? [];
          if (next.has(key)) {
            next.delete(key);
            children.forEach((child) => next.delete(getItemKey(child)));
          } else {
            next.set(key, 'folder');
            children.forEach((child) =>
              next.set(getItemKey(child), child.type as SelectableItemType),
            );
          }
        } else {
          const itemType = item.type as SelectableItemType;
          if (next.has(key)) {
            next.delete(key);
            if (item.folderId) {
              next.delete(getItemKey({ type: 'folder', id: item.folderId } as TreeItem));
            }
          } else {
            next.set(key, itemType);
            if (item.folderId) {
              const siblings = childrenByFolder.get(item.folderId) ?? [];
              const allSelected = siblings.every(
                (s) => getItemKey(s) === key || next.has(getItemKey(s)),
              );
              if (allSelected) {
                next.set(
                  getItemKey({ type: 'folder', id: item.folderId } as TreeItem),
                  'folder',
                );
              }
            }
          }
        }

        return next;
      });
    },
    [childrenByFolder],
  );

  const selectableItems = useMemo(
    () => treeItems.filter((item) => item.type !== 'load-more-folder'),
    [treeItems],
  );

  const toggleAllSelection = useCallback(() => {
    if (
      selectedItems.size === selectableItems.length &&
      selectableItems.length > 0
    ) {
      setSelectedItems(new Map());
    } else {
      setSelectedItems(
        new Map(
          selectableItems.map((item) => [
            getItemKey(item),
            item.type as SelectableItemType,
          ]),
        ),
      );
    }
  }, [selectableItems, selectedItems.size]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Map());
  }, []);

  const isItemSelected = useCallback(
    (item: TreeItem): boolean => {
      return selectedItems.has(getItemKey(item));
    },
    [selectedItems],
  );

  return {
    selectedItems,
    toggleItemSelection,
    toggleAllSelection,
    clearSelection,
    isItemSelected,
    selectableItems,
  };
}

export function getSelectedIdsByType(selected: SelectedItemsMap) {
  const flowIds: string[] = [];
  const tableIds: string[] = [];
  const folderIds: string[] = [];

  for (const [key, type] of selected) {
    const id = key.slice(key.indexOf('-') + 1);
    switch (type) {
      case 'flow':
        flowIds.push(id);
        break;
      case 'table':
        tableIds.push(id);
        break;
      case 'folder':
        folderIds.push(id);
        break;
    }
  }

  return { flowIds, tableIds, folderIds };
}

export function hasMovableOrExportableItems(selected: SelectedItemsMap) {
  for (const type of selected.values()) {
    if (type === 'flow' || type === 'table') {
      return true;
    }
  }
  return false;
}
