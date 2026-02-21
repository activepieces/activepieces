import { useCallback, useMemo, useState } from 'react';

import { TreeItem } from '../lib/types';
import { getItemKey } from '../lib/utils';

export function useAutomationsSelection(treeItems: TreeItem[]) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const childrenByFolder = useMemo(() => {
    const map = new Map<string, TreeItem[]>();
    treeItems.forEach((item) => {
      if (item.parentId && item.type !== 'load-more-folder') {
        const list = map.get(item.parentId) ?? [];
        list.push(item);
        map.set(item.parentId, list);
      }
    });
    return map;
  }, [treeItems]);

  const toggleItemSelection = useCallback(
    (item: TreeItem) => {
      const key = getItemKey(item);
      setSelectedItems((prev) => {
        const next = new Set(prev);

        if (item.type === 'folder') {
          const children = childrenByFolder.get(item.id) ?? [];
          const childKeys = children.map(getItemKey);
          if (next.has(key)) {
            next.delete(key);
            childKeys.forEach((k) => next.delete(k));
          } else {
            next.add(key);
            childKeys.forEach((k) => next.add(k));
          }
        } else {
          if (next.has(key)) {
            next.delete(key);
            if (item.parentId) {
              next.delete(`folder-${item.parentId}`);
            }
          } else {
            next.add(key);
            if (item.parentId) {
              const siblings = childrenByFolder.get(item.parentId) ?? [];
              const siblingKeys = siblings.map(getItemKey);
              const allSelected = siblingKeys.every(
                (k) => k === key || next.has(k),
              );
              if (allSelected) {
                next.add(`folder-${item.parentId}`);
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
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(selectableItems.map(getItemKey)));
    }
  }, [selectableItems, selectedItems.size]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
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

export function getSelectedIdsByType(selectedKeys: Set<string>) {
  const flowIds: string[] = [];
  const tableIds: string[] = [];
  const folderIds: string[] = [];

  for (const key of selectedKeys) {
    if (key.startsWith('flow-')) {
      flowIds.push(key.replace('flow-', ''));
    } else if (key.startsWith('table-')) {
      tableIds.push(key.replace('table-', ''));
    } else if (key.startsWith('folder-')) {
      folderIds.push(key.replace('folder-', ''));
    }
  }

  return { flowIds, tableIds, folderIds };
}

export function hasMovableOrExportableItems(selectedKeys: Set<string>) {
  for (const key of selectedKeys) {
    if (key.startsWith('flow-') || key.startsWith('table-')) {
      return true;
    }
  }
  return false;
}
