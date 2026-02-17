import { t } from 'i18next';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { tableHooks } from '@/features/tables/lib/table-hooks';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { tablesUtils } from '@/features/tables/lib/utils';
import {
  FlowOperationType,
  PopulatedFlow,
  isNil,
  UncategorizedFolderId,
} from '@activepieces/shared';

import { TreeItem } from '../lib/types';

import { getSelectedIdsByType } from './use-automations-selection';

type MutationDeps = {
  invalidateAll: () => void;
  invalidateRoot: () => void;
  invalidateFolder: (folderId: string) => void;
  clearSelection: () => void;
  flows: PopulatedFlow[];
};

export function useAutomationsMutations(deps: MutationDeps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isExportingTables, setIsExportingTables] = useState(false);

  const { mutate: startFromScratch, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(UncategorizedFolderId);

  const { mutate: createTableMutation, isPending: isCreatingTable } =
    tableHooks.useCreateTable(UncategorizedFolderId);

  const { mutate: exportFlows, isPending: isExportFlowsPending } =
    flowHooks.useExportFlows();

  const handleDeleteItem = useCallback(
    async (item: TreeItem) => {
      try {
        if (item.type === 'flow') {
          await flowsApi.delete(item.id);
          toast.success(t('Flow deleted successfully'));
        } else if (item.type === 'table') {
          await tablesApi.delete(item.id);
          toast.success(t('Table deleted successfully'));
        } else if (item.type === 'folder') {
          const { foldersApi } = await import(
            '@/features/automations/lib/folders-api'
          );
          await foldersApi.delete(item.id);
          toast.success(t('Folder deleted successfully'));
        }
        deps.invalidateAll();
      } catch {
        toast.error(t('Failed to delete item'));
      }
    },
    [deps],
  );

  const handleBulkDelete = useCallback(
    async (selectedItems: Set<string>) => {
      const { flowIds, tableIds, folderIds } =
        getSelectedIdsByType(selectedItems);
      setIsDeleting(true);
      try {
        await Promise.all([
          ...flowIds.map((id) => flowsApi.delete(id)),
          ...tableIds.map((id) => tablesApi.delete(id)),
          ...folderIds.map(async (id) => {
            const { foldersApi } = await import(
              '@/features/automations/lib/folders-api'
            );
            return foldersApi.delete(id);
          }),
        ]);
        deps.clearSelection();
        deps.invalidateAll();
        toast.success(t('Items deleted successfully'));
      } catch {
        toast.error(t('Failed to delete items'));
      } finally {
        setIsDeleting(false);
      }
    },
    [deps],
  );

  const handleBulkMoveTo = useCallback(
    async (selectedItems: Set<string>, targetFolderId: string) => {
      const { flowIds, tableIds } = getSelectedIdsByType(selectedItems);
      const folderId =
        isNil(targetFolderId) || targetFolderId === UncategorizedFolderId
          ? null
          : targetFolderId;
      setIsMoving(true);
      try {
        await Promise.all([
          ...flowIds.map((id) =>
            flowsApi.update(id, {
              type: FlowOperationType.CHANGE_FOLDER,
              request: { folderId },
            }),
          ),
          ...tableIds.map((id) => tablesApi.update(id, { folderId })),
        ]);
        deps.clearSelection();
        deps.invalidateAll();
        toast.success(t('Items moved successfully'));
      } catch {
        toast.error(t('Failed to move items'));
      } finally {
        setIsMoving(false);
      }
    },
    [deps],
  );

  const handleBulkExport = useCallback(
    async (selectedItems: Set<string>) => {
      const { flowIds, tableIds } = getSelectedIdsByType(selectedItems);

      if (flowIds.length > 0) {
        const flowsToExport = deps.flows.filter((f) => flowIds.includes(f.id));
        if (flowsToExport.length > 0) {
          exportFlows(flowsToExport);
        }
      }

      if (tableIds.length > 0) {
        setIsExportingTables(true);
        try {
          const exported = await Promise.all(
            tableIds.map((id) => tablesApi.export(id)),
          );
          tablesUtils.exportTables(exported);
          toast.success(
            exported.length === 1
              ? t('Table has been exported.')
              : t('Tables have been exported.'),
          );
        } catch {
          toast.error(t('Failed to export tables'));
        } finally {
          setIsExportingTables(false);
        }
      }

      deps.clearSelection();
    },
    [deps, exportFlows],
  );

  const handleRename = useCallback(
    async (item: TreeItem, newName: string) => {
      setIsRenaming(true);
      try {
        if (item.type === 'flow') {
          await flowsApi.update(item.id, {
            type: FlowOperationType.CHANGE_NAME,
            request: { displayName: newName },
          });
          toast.success(t('Flow renamed successfully'));
        } else if (item.type === 'table') {
          await tablesApi.update(item.id, { name: newName });
          toast.success(t('Table renamed successfully'));
        } else if (item.type === 'folder') {
          const { foldersApi } = await import(
            '@/features/automations/lib/folders-api'
          );
          await foldersApi.renameFolder(item.id, { displayName: newName });
          toast.success(t('Folder renamed successfully'));
        }
        deps.invalidateAll();
      } catch {
        toast.error(t('Failed to rename item'));
      } finally {
        setIsRenaming(false);
      }
    },
    [deps],
  );

  return {
    createFlow: () => startFromScratch(),
    createTable: (name: string) => createTableMutation({ name }),
    isCreateFlowPending,
    isCreatingTable,
    handleDeleteItem,
    handleBulkDelete,
    handleBulkMoveTo,
    handleBulkExport,
    handleRename,
    isDeleting,
    isMoving,
    isRenaming,
    isExporting: isExportFlowsPending || isExportingTables,
  };
}
