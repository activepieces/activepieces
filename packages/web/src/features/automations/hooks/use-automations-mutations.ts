import { isNil } from '@activepieces/core-utils';
import {
  FlowOperationType,
  PopulatedFlow,
  Table,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { flowsApi } from '@/features/flows/api/flows-api';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';
import { foldersApi } from '@/features/folders/api/folders-api';
import { tablesUtils } from '@/features/tables';
import { tablesApi } from '@/features/tables/api/tables-api';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { NEW_FLOW_QUERY_PARAM, NEW_TABLE_QUERY_PARAM } from '@/lib/route-utils';

import { automationMutationUtils } from '../lib/mutation-bodies';
import { SelectedItemsMap, TreeItem } from '../lib/types';

import { getSelectedIdsByType } from './use-automations-selection';

type MutationDeps = {
  invalidateAll: () => void;
  invalidateRoot: () => void;
  invalidateFolder: (folderId: string) => void;
  clearSelection: () => void;
  treeItems: TreeItem[];
  unpinItem?: (itemId: string) => void;
};

export function useAutomationsMutations(deps: MutationDeps) {
  const openNewWindow = useNewWindow();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = authenticationSession.getProjectId() ?? '';

  const { mutate: startFromScratch, isPending: isCreateFlowPending } =
    useMutation<PopulatedFlow, Error, string | undefined>({
      mutationFn: (folderId) =>
        automationMutationUtils.createFlow({
          projectId,
          displayName: t('Untitled'),
          folderId,
        }),
      onSuccess: (flow) => {
        navigate(`/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`);
      },
    });

  const { mutate: createTableMutation, isPending: isCreatingTable } =
    useMutation<Table, Error, { name: string; folderId?: string }>({
      mutationFn: ({ name, folderId }) =>
        automationMutationUtils.createTable({ projectId, name, folderId }),
      onSuccess: (table) => {
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        navigate(
          `/projects/${projectId}/tables/${table.id}?${NEW_TABLE_QUERY_PARAM}=true`,
        );
      },
    });

  const { mutate: exportFlows, isPending: isExportFlowsPending } =
    flowHooks.useExportFlows();

  const { mutateAsync: deleteItem } = useMutation({
    mutationFn: (item: TreeItem) =>
      automationMutationUtils.deleteItem({ id: item.id, type: item.type }),
    onSuccess: () => {
      deps.invalidateAll();
      toast.success(t('Item deleted successfully'));
    },
    onError: () => toast.error(t('Failed to delete item')),
  });

  const { mutateAsync: bulkDelete, isPending: isDeleting } = useMutation({
    mutationFn: async (selectedItems: SelectedItemsMap) => {
      const { flowIds, tableIds, folderIds } =
        getSelectedIdsByType(selectedItems);
      await Promise.all([
        ...flowIds.map((id) => flowsApi.delete(id)),
        ...tableIds.map((id) => tablesApi.delete(id)),
        ...folderIds.map((id) => foldersApi.delete(id)),
      ]);
    },
    onSuccess: () => {
      deps.clearSelection();
      deps.invalidateAll();
      toast.success(t('Items deleted successfully'));
    },
    onError: () => toast.error(t('Failed to delete items')),
  });

  const { mutateAsync: bulkMoveTo, isPending: isBulkMoving } = useMutation({
    mutationFn: async ({
      selectedItems,
      targetFolderId,
    }: {
      selectedItems: SelectedItemsMap;
      targetFolderId: string;
    }) => {
      const { flowIds, tableIds } = getSelectedIdsByType(selectedItems);
      const folderId =
        isNil(targetFolderId) || targetFolderId === UncategorizedFolderId
          ? null
          : targetFolderId;
      await Promise.all([
        ...flowIds.map((id) =>
          flowsApi.update(id, {
            type: FlowOperationType.CHANGE_FOLDER,
            request: { folderId },
          }),
        ),
        ...tableIds.map((id) => tablesApi.update(id, { folderId })),
      ]);
    },
    onSuccess: (_data, { selectedItems, targetFolderId }) => {
      if (targetFolderId && targetFolderId !== UncategorizedFolderId) {
        for (const [id] of selectedItems) {
          deps.unpinItem?.(id);
        }
      }
      deps.clearSelection();
      deps.invalidateAll();
      toast.success(t('Items moved successfully'));
    },
    onError: () => toast.error(t('Failed to move items')),
  });

  const { mutateAsync: rename, isPending: isRenaming } = useMutation({
    mutationFn: ({ item, newName }: { item: TreeItem; newName: string }) =>
      automationMutationUtils.renameItem({
        id: item.id,
        type: item.type,
        newName,
      }),
    onSuccess: () => {
      deps.invalidateAll();
      toast.success(t('Renamed successfully'));
    },
    onError: () => toast.error(t('Failed to rename item')),
  });

  const { mutate: duplicateFlow, isPending: isDuplicating } = useMutation({
    mutationFn: (flow: PopulatedFlow) =>
      automationMutationUtils.duplicateFlow({
        version: flow.version,
        folderId: flow.folderId,
        projectId: flow.projectId,
      }),
    onSuccess: (data) => {
      openNewWindow(`/flows/${data.id}`);
      deps.invalidateAll();
      toast.success(t('Flow duplicated successfully'));
    },
    onError: () => toast.error(t('Failed to duplicate flow')),
  });

  const { mutate: moveItem, isPending: isMovingItem } = useMutation({
    mutationFn: ({
      item,
      targetFolderId,
    }: {
      item: TreeItem;
      targetFolderId: string;
    }) =>
      automationMutationUtils.moveItem({
        id: item.id,
        type: item.type,
        targetFolderId,
      }),
    onSuccess: (_data, { item, targetFolderId }) => {
      if (targetFolderId && targetFolderId !== UncategorizedFolderId) {
        deps.unpinItem?.(item.id);
      }
      deps.invalidateAll();
      toast.success(t('Moved successfully'));
    },
    onError: () => toast.error(t('Failed to move item')),
  });

  const { mutate: exportTable, isPending: isExportingTable } = useMutation({
    mutationFn: (table: Table) => automationMutationUtils.exportTable(table),
    onSuccess: () => toast.success(t('Table has been exported.')),
    onError: () => toast.error(t('Failed to export table')),
  });

  const handleBulkExport = useCallback(
    (selectedItems: SelectedItemsMap) => {
      const { flowIds, tableIds } = getSelectedIdsByType(selectedItems);

      if (flowIds.length > 0) {
        const flowsById = new Map(
          deps.treeItems
            .filter(isFlowTreeItem)
            .map((item) => [item.id, item.data]),
        );
        const flowsToExport = flowIds
          .map((id) => flowsById.get(id))
          .filter((flow): flow is PopulatedFlow => !isNil(flow));
        if (flowsToExport.length > 0) {
          exportFlows(flowsToExport);
        }
      }

      if (tableIds.length > 0) {
        const tables = tableIds.map((id) => ({ id } as Table));
        Promise.all(tables.map((tbl) => tablesApi.export(tbl.id)))
          .then((exported) => {
            tablesUtils.exportTables(exported);
            toast.success(
              exported.length === 1
                ? t('Table has been exported.')
                : t('Tables have been exported.'),
            );
          })
          .catch(() => toast.error(t('Failed to export tables')));
      }

      deps.clearSelection();
    },
    [deps, exportFlows],
  );

  const handleExportFlow = useCallback(
    (flow: PopulatedFlow) => {
      exportFlows([flow]);
    },
    [exportFlows],
  );

  return {
    createFlow: (folderId?: string) => startFromScratch(folderId),
    createTable: (name: string, folderId?: string) =>
      createTableMutation({ name, folderId }),
    isCreateFlowPending,
    isCreatingTable,
    handleDeleteItem: deleteItem,
    handleBulkDelete: bulkDelete,
    handleBulkMoveTo: (
      selectedItems: SelectedItemsMap,
      targetFolderId: string,
    ) => bulkMoveTo({ selectedItems, targetFolderId }),
    handleBulkExport,
    handleRename: (item: TreeItem, newName: string) =>
      rename({ item, newName }),
    handleDuplicateFlow: duplicateFlow,
    handleMoveItem: (item: TreeItem, targetFolderId: string) =>
      moveItem({ item, targetFolderId }),
    handleExportFlow,
    handleExportTable: exportTable,
    isDeleting,
    isMoving: isBulkMoving || isMovingItem,
    isRenaming,
    isDuplicating,
    isExporting: isExportFlowsPending || isExportingTable,
  };
}

function isFlowTreeItem(
  item: TreeItem,
): item is TreeItem & { data: PopulatedFlow } {
  return item.type === 'flow' && !isNil(item.data);
}
