import { isNil } from '@activepieces/core-utils';
import {
  FlowOperationType,
  PopulatedFlow,
  Table,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { flowsApi } from '@/features/flows/api/flows-api';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';
import { tablesUtils } from '@/features/tables';
import { tablesApi } from '@/features/tables/api/tables-api';
import { tableHooks } from '@/features/tables/hooks/table-hooks';

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
      flowsApi.create({
        projectId,
        displayName: t('Untitled'),
        folderId:
          !folderId || folderId === UncategorizedFolderId
            ? undefined
            : folderId,
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
      tableHooks.createTableWithDefaults({
        name,
        folderId:
          !folderId || folderId === UncategorizedFolderId
            ? undefined
            : folderId,
        projectId,
      }),
    onSuccess: invalidate,
    onError: () => toast.error(t('Failed to create table')),
  });

  const rename = useMutation<
    void,
    Error,
    { item: BrowseManageItem; newName: string }
  >({
    mutationFn: async ({ item, newName }) => {
      if (item.type === 'flow') {
        await flowsApi.update(item.id, {
          type: FlowOperationType.CHANGE_NAME,
          request: { displayName: newName },
        });
      } else {
        await tablesApi.update(item.id, { name: newName });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(t('Renamed successfully'));
    },
    onError: () => toast.error(t('Failed to rename item')),
  });

  const deleteItem = useMutation<void, Error, BrowseManageItem>({
    mutationFn: async (item) => {
      if (item.type === 'flow') {
        await flowsApi.delete(item.id);
      } else {
        await tablesApi.delete(item.id);
      }
    },
    onSuccess: invalidate,
  });

  const moveItem = useMutation<
    void,
    Error,
    { item: BrowseManageItem; targetFolderId: string }
  >({
    mutationFn: async ({ item, targetFolderId }) => {
      const folderId =
        isNil(targetFolderId) || targetFolderId === UncategorizedFolderId
          ? null
          : targetFolderId;
      if (item.type === 'flow') {
        await flowsApi.update(item.id, {
          type: FlowOperationType.CHANGE_FOLDER,
          request: { folderId },
        });
      } else {
        await tablesApi.update(item.id, { folderId });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(t('Moved successfully'));
    },
    onError: () => toast.error(t('Failed to move item')),
  });

  const duplicateFlow = useMutation<PopulatedFlow, Error, PopulatedFlow>({
    mutationFn: async (flow) => {
      const version = flow.version;
      const displayName = `${version.displayName} - Copy`;
      const created = await flowsApi.create({
        displayName,
        projectId,
        folderId: flow.folderId ?? undefined,
      });
      return flowsApi.update(created.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName,
          trigger: version.trigger,
          schemaVersion: version.schemaVersion,
          notes: version.notes,
        },
      });
    },
    onSuccess: invalidate,
    onError: () => toast.error(t('Failed to duplicate flow')),
  });

  const exportTable = useMutation<void, Error, Table>({
    mutationFn: async (table) => {
      const exported = await tablesApi.export(table.id);
      tablesUtils.exportTables([exported]);
    },
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
