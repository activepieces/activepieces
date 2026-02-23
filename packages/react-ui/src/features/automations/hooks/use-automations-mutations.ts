import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { tableHooks } from '@/features/tables/lib/table-hooks';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { tablesUtils } from '@/features/tables/lib/utils';
import { useNewWindow } from '@/lib/navigation-utils';
import {
  FlowOperationType,
  PopulatedFlow,
  Table,
  isNil,
  UncategorizedFolderId,
} from '@activepieces/shared';

import { SelectedItemsMap, TreeItem } from '../lib/types';

import { getSelectedIdsByType } from './use-automations-selection';

type MutationDeps = {
  invalidateAll: () => void;
  invalidateRoot: () => void;
  invalidateFolder: (folderId: string) => void;
  clearSelection: () => void;
  flows: PopulatedFlow[];
};

export function useAutomationsMutations(deps: MutationDeps) {
  const openNewWindow = useNewWindow();

  const { mutate: startFromScratch, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(UncategorizedFolderId);

  const { mutate: createTableMutation, isPending: isCreatingTable } =
    tableHooks.useCreateTable(UncategorizedFolderId);

  const { mutate: exportFlows, isPending: isExportFlowsPending } =
    flowHooks.useExportFlows();

  const { mutateAsync: deleteItem } = useMutation({
    mutationFn: async (item: TreeItem) => {
      if (item.type === 'flow') {
        await flowsApi.delete(item.id);
      } else if (item.type === 'table') {
        await tablesApi.delete(item.id);
      } else if (item.type === 'folder') {
        await foldersApi.delete(item.id);
      }
    },
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

  const {
    mutateAsync: bulkMoveTo,
    isPending: isBulkMoving,
  } = useMutation({
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
    onSuccess: () => {
      deps.clearSelection();
      deps.invalidateAll();
      toast.success(t('Items moved successfully'));
    },
    onError: () => toast.error(t('Failed to move items')),
  });

  const { mutateAsync: rename, isPending: isRenaming } = useMutation({
    mutationFn: async ({
      item,
      newName,
    }: {
      item: TreeItem;
      newName: string;
    }) => {
      if (item.type === 'flow') {
        await flowsApi.update(item.id, {
          type: FlowOperationType.CHANGE_NAME,
          request: { displayName: newName },
        });
      } else if (item.type === 'table') {
        await tablesApi.update(item.id, { name: newName });
      } else if (item.type === 'folder') {
        await foldersApi.renameFolder(item.id, { displayName: newName });
      }
    },
    onSuccess: () => {
      deps.invalidateAll();
      toast.success(t('Renamed successfully'));
    },
    onError: () => toast.error(t('Failed to rename item')),
  });

  const { mutate: duplicateFlow, isPending: isDuplicating } = useMutation({
    mutationFn: async (flow: PopulatedFlow) => {
      const version = flow.version;
      const displayName = `${version.displayName} - Copy`;
      const createdFlow = await flowsApi.create({
        displayName,
        projectId: flow.projectId,
        folderId: flow.folderId ?? undefined,
      });
      return flowsApi.update(createdFlow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName,
          trigger: version.trigger,
          schemaVersion: version.schemaVersion,
          notes: version.notes,
        },
      });
    },
    onSuccess: (data) => {
      openNewWindow(`/flows/${data.id}`);
      deps.invalidateAll();
      toast.success(t('Flow duplicated successfully'));
    },
    onError: () => toast.error(t('Failed to duplicate flow')),
  });

  const { mutate: moveItem, isPending: isMovingItem } = useMutation({
    mutationFn: async ({
      item,
      targetFolderId,
    }: {
      item: TreeItem;
      targetFolderId: string;
    }) => {
      const folderId =
        isNil(targetFolderId) || targetFolderId === UncategorizedFolderId
          ? null
          : targetFolderId;
      if (item.type === 'flow') {
        await flowsApi.update(item.id, {
          type: FlowOperationType.CHANGE_FOLDER,
          request: { folderId },
        });
      } else if (item.type === 'table') {
        await tablesApi.update(item.id, { folderId });
      }
    },
    onSuccess: () => {
      deps.invalidateAll();
      toast.success(t('Moved successfully'));
    },
    onError: () => toast.error(t('Failed to move item')),
  });

  const { mutate: exportTable, isPending: isExportingTable } = useMutation({
    mutationFn: async (table: Table) => {
      const exported = await tablesApi.export(table.id);
      tablesUtils.exportTables([exported]);
    },
    onSuccess: () => toast.success(t('Table has been exported.')),
    onError: () => toast.error(t('Failed to export table')),
  });

  const handleBulkExport = useCallback(
    (selectedItems: SelectedItemsMap) => {
      const { flowIds, tableIds } = getSelectedIdsByType(selectedItems);

      if (flowIds.length > 0) {
        const flowsToExport = deps.flows.filter((f) => flowIds.includes(f.id));
        if (flowsToExport.length > 0) {
          exportFlows(flowsToExport);
        }
      }

      if (tableIds.length > 0) {
        const tables = tableIds.map(
          (id) => ({ id }) as Table,
        );
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
    createFlow: () => startFromScratch(),
    createTable: (name: string) => createTableMutation({ name }),
    isCreateFlowPending,
    isCreatingTable,
    handleDeleteItem: deleteItem,
    handleBulkDelete: bulkDelete,
    handleBulkMoveTo: (selectedItems: SelectedItemsMap, targetFolderId: string) =>
      bulkMoveTo({ selectedItems, targetFolderId }),
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
