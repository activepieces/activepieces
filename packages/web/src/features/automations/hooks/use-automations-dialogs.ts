import { useCallback, useState } from 'react';

import { SelectedItemsMap, TreeItem } from '../lib/types';

import { useAutomationsMutations } from './use-automations-mutations';

type DialogsDeps = {
  mutations: ReturnType<typeof useAutomationsMutations>;
  selectedItems: SelectedItemsMap;
};

export function useAutomationsDialogs({
  mutations,
  selectedItems,
}: DialogsDeps) {
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isImportFlowDialogOpen, setIsImportFlowDialogOpen] = useState(false);
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] = useState(false);
  const [moveToDialogOpen, setMoveToDialogOpen] = useState(false);
  const [moveToFolderId, setMoveToFolderId] = useState<string>('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [itemToRename, setItemToRename] = useState<TreeItem | null>(null);

  const openRenameDialog = useCallback((item: TreeItem) => {
    setItemToRename(item);
    setNewName(item.name);
    setRenameDialogOpen(true);
  }, []);

  const handleRename = useCallback(async () => {
    if (!itemToRename || !newName.trim()) return;
    await mutations.handleRename(itemToRename, newName);
    setRenameDialogOpen(false);
    setItemToRename(null);
  }, [itemToRename, newName, mutations]);

  const handleBulkMoveTo = useCallback(async () => {
    await mutations.handleBulkMoveTo(selectedItems, moveToFolderId);
    setMoveToDialogOpen(false);
  }, [selectedItems, moveToFolderId, mutations]);

  return {
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    isImportFlowDialogOpen,
    setIsImportFlowDialogOpen,
    isImportTableDialogOpen,
    setIsImportTableDialogOpen,
    moveToDialogOpen,
    setMoveToDialogOpen,
    moveToFolderId,
    setMoveToFolderId,
    renameDialogOpen,
    setRenameDialogOpen,
    newName,
    setNewName,
    openRenameDialog,
    handleRename,
    handleBulkMoveTo,
  };
}
