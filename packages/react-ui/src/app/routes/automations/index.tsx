import { t } from 'i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { AutomationsEmptyState } from '@/features/automations/components/automations-empty-state';
import { AutomationsFilters as AutomationsFiltersComponent } from '@/features/automations/components/automations-filters';
import { AutomationsNoResultsState } from '@/features/automations/components/automations-no-results-state';
import { AutomationsPagination } from '@/features/automations/components/automations-pagination';
import { AutomationsSelectionBar } from '@/features/automations/components/automations-selection-bar';
import { AutomationsTable } from '@/features/automations/components/automations-table';
import { MoveToFolderDialog } from '@/features/automations/components/move-to-folder-dialog';
import { RenameDialog } from '@/features/automations/components/rename-dialog';
import { useAutomationsData } from '@/features/automations/hooks/use-automations-data';
import { useAutomationsMutations } from '@/features/automations/hooks/use-automations-mutations';
import {
  useAutomationsSelection,
  hasMovableOrExportableItems,
} from '@/features/automations/hooks/use-automations-selection';
import { AutomationsFilters, TreeItem } from '@/features/automations/lib/types';
import { hasActiveFilters } from '@/features/automations/lib/utils';
import { appConnectionsQueries } from '@/features/connections/lib/app-connections-hooks';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { CreateFolderDialog } from '@/features/folders/component/create-folder-dialog';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { ImportTableDialog } from '@/features/tables/components/import-table-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { Permission, UncategorizedFolderId } from '@activepieces/shared';

export const AutomationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projectId: projectIdFromUrl } = useParams<{ projectId: string }>();
  const projectId = projectIdFromUrl ?? authenticationSession.getProjectId()!;

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [connectionFilter, setConnectionFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);

  const prevProjectIdRef = useRef(projectId);
  useEffect(() => {
    if (prevProjectIdRef.current !== projectId) {
      prevProjectIdRef.current = projectId;
      setSearchTerm('');
      setTypeFilter([]);
      setStatusFilter([]);
      setConnectionFilter([]);
      setOwnerFilter([]);
    }
  }, [projectId]);

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

  const filtersActive = hasActiveFilters(filters);

  const {
    treeItems,
    folders,
    rootFlows,
    rootTables,
    isLoading,
    isFiltered,
    expandedFolders,
    loadingFolders,
    toggleFolder,
    loadMoreInFolder,
    rootPage,
    totalPages,
    totalPageItems,
    nextRootPage,
    prevRootPage,
    resetPagination,
    invalidateAll,
    invalidateRoot,
    invalidateFolder,
  } = useAutomationsData(filters);

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
    selectableItems,
  } = useAutomationsSelection(treeItems);

  useEffect(() => {
    clearSelection();
  }, [projectId, clearSelection]);

  const mutations = useAutomationsMutations({
    invalidateAll,
    invalidateRoot,
    invalidateFolder,
    clearSelection,
    flows: rootFlows,
  });

  const { data: connections } = appConnectionsQueries.useAppConnections({
    request: { projectId, limit: 10000 },
    extraKeys: [projectId],
  });

  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { pieces } = piecesHooks.usePieces({});
  const { data: currentUser } = userHooks.useCurrentUser();

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

  const updateSearchParams = (newFolderId: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (newFolderId) {
      newParams.set('folderId', newFolderId);
    } else {
      newParams.delete('folderId');
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setTypeFilter([]);
    setStatusFilter([]);
    setConnectionFilter([]);
    setOwnerFilter([]);
  }, []);

  const hasAnyItems =
    rootFlows.length > 0 || rootTables.length > 0 || folders.length > 0;
  const isEmptyState = !hasAnyItems && !isLoading && !filtersActive;
  const isNoResultsState =
    treeItems.length === 0 && filtersActive && !isLoading;

  if (isEmptyState) {
    return <AutomationsEmptyState onRefresh={() => invalidateAll()} />;
  }

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
        onCreateFlow={mutations.createFlow}
        onCreateTable={() => mutations.createTable(t('New Table'))}
        onCreateFolder={() => setIsFolderDialogOpen(true)}
        onImportFlow={() => setIsImportFlowDialogOpen(true)}
        onImportTable={() => setIsImportTableDialogOpen(true)}
        onClearAllFilters={clearAllFilters}
        hasActiveFilters={filtersActive}
        isCreatingFlow={mutations.isCreateFlowPending}
        isCreatingTable={mutations.isCreatingTable}
      />

      {isNoResultsState ? (
        <AutomationsNoResultsState onClearFilters={clearAllFilters} />
      ) : (
        <>
          <AutomationsTable
            items={treeItems}
            isLoading={isLoading}
            selectedItems={selectedItems}
            expandedFolders={expandedFolders}
            loadingFolders={loadingFolders}
            projectMembers={projectMembers}
            selectableCount={selectableItems.length}
            onToggleAllSelection={toggleAllSelection}
            onToggleItemSelection={toggleItemSelection}
            onRowClick={handleRowClick}
            onRenameItem={openRenameDialog}
            onDeleteItem={mutations.handleDeleteItem}
            onLoadMoreInFolder={loadMoreInFolder}
            isItemSelected={isItemSelected}
          />

          <AutomationsPagination
            currentPage={rootPage}
            totalItems={totalPageItems}
            totalPages={totalPages}
            onPrevPage={prevRootPage}
            onNextPage={nextRootPage}
          />
        </>
      )}

      <AutomationsSelectionBar
        selectedCount={selectedItems.size}
        isDeleting={mutations.isDeleting}
        isMoving={mutations.isMoving}
        isExporting={mutations.isExporting}
        hasMovableOrExportableItems={hasMovableOrExportableItems(selectedItems)}
        onMoveClick={() => setMoveToDialogOpen(true)}
        onDeleteClick={() => mutations.handleBulkDelete(selectedItems)}
        onExportClick={() => mutations.handleBulkExport(selectedItems)}
        onClearSelection={clearSelection}
      />

      <MoveToFolderDialog
        open={moveToDialogOpen}
        onOpenChange={setMoveToDialogOpen}
        folders={folders}
        selectedFolderId={moveToFolderId}
        onFolderChange={setMoveToFolderId}
        onConfirm={handleBulkMoveTo}
        isMoving={mutations.isMoving}
      />

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        value={newName}
        onChange={setNewName}
        onConfirm={handleRename}
        isRenaming={mutations.isRenaming}
      />

      <CreateFolderDialog
        updateSearchParams={updateSearchParams}
        open={isFolderDialogOpen}
        onOpenChange={(open) => {
          setIsFolderDialogOpen(open);
          if (!open) invalidateAll();
        }}
      />

      <ImportFlowDialog
        insideBuilder={false}
        folderId={UncategorizedFolderId}
        onRefresh={() => invalidateAll()}
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
        onImportSuccess={() => invalidateAll()}
      />
    </div>
  );
};
