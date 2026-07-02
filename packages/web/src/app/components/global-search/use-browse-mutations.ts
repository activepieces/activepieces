import { PopulatedFlow, Table } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { automationMutationUtils } from '@/features/automations/lib/mutation-bodies';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';

const PAGE_QUERY_KEYS = [
  'folders',
  'root-flows',
  'root-tables',
  'all-folder-contents',
  'tables',
];

export function useBrowseMutations(projectId: string) {
  const queryClient = useQueryClient();
  const { mutate: exportFlowsMutate, isPending: isExportingFlow } =
    flowHooks.useExportFlows();

  // Keep both the Browse panel (project-scoped keys) and the Automations page
  // (its own keys) in sync after any change.
  const invalidate = () => {
    for (const key of ['browse-flows', 'browse-tables', 'browse-folders']) {
      queryClient.invalidateQueries({ queryKey: [key, projectId] });
    }
    for (const key of PAGE_QUERY_KEYS) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const createFlow = useMutation<PopulatedFlow, Error, string | undefined>({
    mutationFn: (folderId) =>
      automationMutationUtils.createFlow({
        projectId,
        displayName: t('Untitled'),
        folderId,
      }),
    onSuccess: invalidate,
    onError: () => toast.error(t('Failed to create flow')),
  });

  const createTable = useMutation<
    Table,
    Error,
    { name: string; folderId?: string }
  >({
    mutationFn: ({ name, folderId }) =>
      automationMutationUtils.createTable({ projectId, name, folderId }),
    onSuccess: invalidate,
    onError: () => toast.error(t('Failed to create table')),
  });

  const rename = useMutation<
    void,
    Error,
    { item: BrowseManageItem; newName: string }
  >({
    mutationFn: ({ item, newName }) =>
      automationMutationUtils.renameItem({
        id: item.id,
        type: item.type,
        newName,
      }),
    onSuccess: () => {
      invalidate();
      toast.success(t('Renamed successfully'));
    },
    onError: () => toast.error(t('Failed to rename item')),
  });

  const deleteItem = useMutation<void, Error, BrowseManageItem>({
    mutationFn: (item) =>
      automationMutationUtils.deleteItem({ id: item.id, type: item.type }),
    onSuccess: invalidate,
  });

  const moveItem = useMutation<
    void,
    Error,
    { item: BrowseManageItem; targetFolderId: string }
  >({
    mutationFn: ({ item, targetFolderId }) =>
      automationMutationUtils.moveItem({
        id: item.id,
        type: item.type,
        targetFolderId,
      }),
    onSuccess: () => {
      invalidate();
      toast.success(t('Moved successfully'));
    },
    onError: () => toast.error(t('Failed to move item')),
  });

  const duplicateFlow = useMutation<PopulatedFlow, Error, PopulatedFlow>({
    mutationFn: (flow) =>
      automationMutationUtils.duplicateFlow({
        version: flow.version,
        folderId: flow.folderId,
        projectId,
      }),
    onSuccess: invalidate,
    onError: () => toast.error(t('Failed to duplicate flow')),
  });

  const exportTable = useMutation<void, Error, Table>({
    mutationFn: (table) => automationMutationUtils.exportTable(table),
    onSuccess: () => toast.success(t('Table has been exported.')),
    onError: () => toast.error(t('Failed to export table')),
  });

  return {
    createFlow: (folderId?: string) => createFlow.mutateAsync(folderId),
    createTable: (name: string, folderId?: string) =>
      createTable.mutateAsync({ name, folderId }),
    renameItem: (item: BrowseManageItem, newName: string) =>
      rename.mutateAsync({ item, newName }),
    deleteItem: (item: BrowseManageItem) => deleteItem.mutateAsync(item),
    moveItem: (item: BrowseManageItem, targetFolderId: string) =>
      moveItem.mutateAsync({ item, targetFolderId }),
    duplicateFlow: (flow: PopulatedFlow) => duplicateFlow.mutateAsync(flow),
    exportFlow: (flow: PopulatedFlow) => exportFlowsMutate([flow]),
    exportTable: (table: Table) => exportTable.mutate(table),
    invalidate,
    isCreatingFlow: createFlow.isPending,
    isCreatingTable: createTable.isPending,
    isRenaming: rename.isPending,
    isMoving: moveItem.isPending,
    isDuplicating: duplicateFlow.isPending,
    isExporting: isExportingFlow || exportTable.isPending,
  };
}

export type BrowseManageItem = { type: 'flow' | 'table'; id: string };
