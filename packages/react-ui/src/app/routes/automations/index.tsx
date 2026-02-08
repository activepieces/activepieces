import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { AutomationsEmptyState } from '@/features/automations/components/automations-empty-state';
import {
  useAutomationsTree,
  useAutomationsSelection,
  automationsCollectionUtils,
  getSelectedIdsByType,
  hasMovableOrExportableItems,
  flowsCollection,
  tablesCollection,
  type AutomationsFilters,
  type TreeItem,
} from '@/features/automations/lib/automations-collection';
import { appConnectionsQueries } from '@/features/connections/lib/app-connections-hooks';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { CreateFolderDialog } from '@/features/folders/component/create-folder-dialog';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { ImportTableDialog } from '@/features/tables/components/import-table-dialog';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { recordsApi } from '@/features/tables/lib/records-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { tablesUtils } from '@/features/tables/lib/utils';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { NEW_FLOW_QUERY_PARAM, NEW_TABLE_QUERY_PARAM } from '@/lib/utils';
import {
  FieldType,
  isNil,
  Permission,
  UncategorizedFolderId,
} from '@activepieces/shared';

import { AutomationsFilters as AutomationsFiltersComponent } from '../../../features/automations/components/automations-filters';
import { AutomationsSelectionBar } from '../../../features/automations/components/automations-selection-bar';
import { AutomationsTable } from '../../../features/automations/components/automations-table';
import { MoveToFolderDialog } from '../../../features/automations/components/move-to-folder-dialog';
import { RenameDialog } from '../../../features/automations/components/rename-dialog';

export const AutomationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId()!;

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [connectionFilter, setConnectionFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isImportFlowDialogOpen, setIsImportFlowDialogOpen] = useState(false);
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] = useState(false);
  const [moveToDialogOpen, setMoveToDialogOpen] = useState(false);
  const [moveToFolderId, setMoveToFolderId] = useState<string>('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [itemToRename, setItemToRename] = useState<TreeItem | null>(null);

  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const userHasPermissionToWriteTable = checkAccess(Permission.WRITE_TABLE);
  const userHasPermissionToWriteFolder = checkAccess(Permission.WRITE_FOLDER);

  const filters: AutomationsFilters = useMemo(
    () => ({
      searchTerm,
      typeFilter,
      statusFilter,
      connectionFilter,
      ownerFilter,
    }),
    [searchTerm, typeFilter, statusFilter, connectionFilter, ownerFilter],
  );

  const {
    treeItems,
    expandedFolders,
    toggleFolder,
    loadMoreInFolder,
    loadMoreRoot,
    resetPagination,
    isLoading,
    flows,
    tables,
    folders,
  } = useAutomationsTree(filters);

  useEffect(() => {
    resetPagination();
  }, [
    searchTerm,
    typeFilter,
    statusFilter,
    connectionFilter,
    ownerFilter,
    resetPagination,
  ]);

  const {
    selectedItems,
    toggleItemSelection,
    toggleAllSelection,
    clearSelection,
    isItemSelected,
  } = useAutomationsSelection(treeItems, flows, tables);

  const { data: connections } = appConnectionsQueries.useAppConnections({
    request: {
      projectId,
      limit: 10000,
    },
    extraKeys: [projectId],
  });

  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { pieces } = piecesHooks.usePieces({});
  const { data: currentUser } = userHooks.useCurrentUser();

  const { mutate: createFlow, isPending: isCreateFlowPending } = useMutation({
    mutationFn: async () => {
      const flow = await flowsApi.create({
        projectId,
        displayName: t('Untitled'),
      });
      return flow;
    },
    onSuccess: (flow) => {
      flowsCollection.utils.writeInsert(flow);
      navigate(`/flows/${flow.id}?${NEW_FLOW_QUERY_PARAM}=true`);
    },
  });

  const { mutate: createTable, isPending: isCreatingTable } = useMutation({
    mutationFn: async (data: { name: string }) => {
      const table = await tablesApi.create({
        projectId,
        name: data.name,
      });

      const field = await fieldsApi.create({
        name: 'Name',
        type: FieldType.TEXT,
        tableId: table.id,
      });

      await recordsApi.create({
        records: [
          [
            {
              fieldId: field.id,
              value: '',
            },
          ],
        ],
        tableId: table.id,
      });

      return table;
    },
    onSuccess: (table) => {
      tablesCollection.utils.writeInsert(table);
      navigate(
        `/projects/${projectId}/tables/${table.id}?${NEW_TABLE_QUERY_PARAM}=true`,
      );
    },
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isExportingTables, setIsExportingTables] = useState(false);

  const { mutate: exportFlows, isPending: isExportFlowsPending } =
    flowHooks.useExportFlows();
  const isExporting = isExportFlowsPending || isExportingTables;

  const handleBulkDelete = useCallback(async () => {
    const { flowIds, tableIds, folderIds } =
      getSelectedIdsByType(selectedItems);
    setIsDeleting(true);

    try {
      if (flowIds.length > 0) {
        automationsCollectionUtils.deleteFlows(flowIds);
      }
      if (tableIds.length > 0) {
        automationsCollectionUtils.deleteTables(tableIds);
      }
      if (folderIds.length > 0) {
        automationsCollectionUtils.deleteFolders(folderIds);
      }
      clearSelection();
      toast.success(t('Items deleted successfully'));
    } catch (error) {
      toast.error(t('Failed to delete items'));
    } finally {
      setIsDeleting(false);
    }
  }, [selectedItems, clearSelection]);

  const handleBulkExport = useCallback(async () => {
    const { flowIds, tableIds } = getSelectedIdsByType(selectedItems);

    if (flowIds.length > 0) {
      const flowsToExport = flows.filter((flow) => flowIds.includes(flow.id));
      if (flowsToExport.length > 0) {
        exportFlows(flowsToExport);
      }
    }

    if (tableIds.length > 0) {
      setIsExportingTables(true);
      try {
        const exportedTables = await Promise.all(
          tableIds.map((id) => tablesApi.export(id)),
        );
        tablesUtils.exportTables(exportedTables);
        toast.success(
          exportedTables.length === 1
            ? t('Table has been exported.')
            : t('Tables have been exported.'),
        );
      } catch (error) {
        toast.error(t('Failed to export tables'));
      } finally {
        setIsExportingTables(false);
      }
    }

    clearSelection();
  }, [selectedItems, flows, exportFlows, clearSelection]);

  const handleBulkMoveTo = useCallback(async () => {
    const { flowIds, tableIds } = getSelectedIdsByType(selectedItems);
    const targetFolderId =
      isNil(moveToFolderId) || moveToFolderId === UncategorizedFolderId
        ? null
        : moveToFolderId;
    setIsMoving(true);

    try {
      flowIds.forEach((id) => {
        automationsCollectionUtils.moveFlowToFolder(id, targetFolderId);
      });
      tableIds.forEach((id) => {
        automationsCollectionUtils.moveTableToFolder(id, targetFolderId);
      });
      setMoveToDialogOpen(false);
      clearSelection();
      toast.success(t('Items moved successfully'));
    } catch (error) {
      toast.error(t('Failed to move items'));
    } finally {
      setIsMoving(false);
    }
  }, [selectedItems, moveToFolderId, clearSelection]);

  const handleDeleteItem = useCallback((item: TreeItem) => {
    switch (item.type) {
      case 'flow':
        automationsCollectionUtils.deleteFlows([item.id]);
        toast.success(t('Flow deleted successfully'));
        break;
      case 'table':
        automationsCollectionUtils.deleteTables([item.id]);
        toast.success(t('Table deleted successfully'));
        break;
      case 'folder':
        automationsCollectionUtils.deleteFolders([item.id]);
        toast.success(t('Folder deleted successfully'));
        break;
    }
  }, []);

  const openRenameDialog = useCallback((item: TreeItem) => {
    setItemToRename(item);
    setNewName(item.name);
    setRenameDialogOpen(true);
  }, []);

  const handleRename = useCallback(async () => {
    if (!itemToRename || !newName.trim()) return;
    setIsRenaming(true);
    try {
      switch (itemToRename.type) {
        case 'flow':
          automationsCollectionUtils.renameFlow(itemToRename.id, newName);
          toast.success(t('Flow renamed successfully'));
          break;
        case 'table':
          automationsCollectionUtils.renameTable(itemToRename.id, newName);
          toast.success(t('Table renamed successfully'));
          break;
        case 'folder':
          automationsCollectionUtils.renameFolder(itemToRename.id, newName);
          toast.success(t('Folder renamed successfully'));
          break;
      }
      setRenameDialogOpen(false);
      setItemToRename(null);
    } catch (error) {
      toast.error(t('Failed to rename item'));
    } finally {
      setIsRenaming(false);
    }
  }, [itemToRename, newName]);

  const handleRowClick = useCallback(
    (item: TreeItem) => {
      if (item.type === 'folder') {
        toggleFolder(item.id);
      } else if (item.type === 'flow') {
        navigate(
          authenticationSession.appendProjectRoutePrefix(`/flows/${item.id}`),
        );
      } else if (item.type === 'table') {
        navigate(
          authenticationSession.appendProjectRoutePrefix(`/tables/${item.id}`),
        );
      }
    },
    [navigate, toggleFolder],
  );

  const updateSearchParams = (newFolderId: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (newFolderId) {
      newParams.set('folderId', newFolderId);
    } else {
      newParams.delete('folderId');
    }
    setSearchParams(newParams);
  };

  if (isCreateFlowPending || isCreatingTable) {
    return <LoadingScreen mode="container" />;
  }

  const displayItems = treeItems;

  return (
    <div className="flex flex-col w-full">
      <AutomationsFiltersComponent
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        connectionFilter={connectionFilter}
        onConnectionFilterChange={setConnectionFilter}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        connections={connections?.data}
        projectMembers={projectMembers}
        pieces={pieces}
        currentUser={currentUser}
        userHasPermissionToWriteFlow={userHasPermissionToWriteFlow}
        userHasPermissionToWriteTable={userHasPermissionToWriteTable}
        userHasPermissionToWriteFolder={userHasPermissionToWriteFolder}
        onCreateFlow={() => createFlow()}
        onCreateTable={() => createTable({ name: t('New Table') })}
        onCreateFolder={() => setIsFolderDialogOpen(true)}
        onImportFlow={() => setIsImportFlowDialogOpen(true)}
        onImportTable={() => setIsImportTableDialogOpen(true)}
      />

      {displayItems.length === 0 && !isLoading ? (
        <AutomationsEmptyState onRefresh={() => {}} />
      ) : (
        <AutomationsTable
          items={displayItems}
          isLoading={isLoading}
          selectedItems={selectedItems}
          expandedFolders={expandedFolders}
          projectMembers={projectMembers}
          onToggleAllSelection={toggleAllSelection}
          onToggleItemSelection={toggleItemSelection}
          onRowClick={handleRowClick}
          onRenameItem={openRenameDialog}
          onDeleteItem={handleDeleteItem}
          onLoadMoreInFolder={loadMoreInFolder}
          onLoadMoreRoot={loadMoreRoot}
          isItemSelected={isItemSelected}
        />
      )}

      <AutomationsSelectionBar
        selectedCount={selectedItems.size}
        isDeleting={isDeleting}
        isMoving={isMoving}
        isExporting={isExporting}
        hasMovableOrExportableItems={hasMovableOrExportableItems(selectedItems)}
        onMoveClick={() => setMoveToDialogOpen(true)}
        onDeleteClick={handleBulkDelete}
        onExportClick={handleBulkExport}
        onClearSelection={clearSelection}
      />

      <MoveToFolderDialog
        open={moveToDialogOpen}
        onOpenChange={setMoveToDialogOpen}
        folders={folders}
        selectedFolderId={moveToFolderId}
        onFolderChange={setMoveToFolderId}
        onConfirm={handleBulkMoveTo}
        isMoving={isMoving}
      />

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        value={newName}
        onChange={setNewName}
        onConfirm={handleRename}
        isRenaming={isRenaming}
      />

      <CreateFolderDialog
        updateSearchParams={updateSearchParams}
        open={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
      />

      <ImportFlowDialog
        insideBuilder={false}
        folderId={UncategorizedFolderId}
        onRefresh={() => {}}
      >
        <button
          className="hidden"
          ref={(el) => {
            if (el && isImportFlowDialogOpen) {
              el.click();
              setIsImportFlowDialogOpen(false);
            }
          }}
        />
      </ImportFlowDialog>

      <ImportTableDialog
        open={isImportTableDialogOpen}
        setIsOpen={setIsImportTableDialogOpen}
        showTrigger={false}
        onImportSuccess={() => {}}
      />
    </div>
  );
};
