import { t } from 'i18next';
import { useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { AutomationsEmptyState } from '@/features/automations/components/automations-empty-state';
import { AutomationsFilters as AutomationsFiltersComponent } from '@/features/automations/components/automations-filters';
import { AutomationsNoResultsState } from '@/features/automations/components/automations-no-results-state';
import { AutomationsPagination } from '@/features/automations/components/automations-pagination';
import { AutomationsSelectionBar } from '@/features/automations/components/automations-selection-bar';
import { AutomationsTable } from '@/features/automations/components/automations-table';
import { CreateFolderDialog } from '@/features/automations/components/create-folder-dialog';
import { ImportFlowDialog } from '@/features/automations/components/import-flow-dialog';
import { MoveToFolderDialog } from '@/features/automations/components/move-to-folder-dialog';
import { RenameDialog } from '@/features/automations/components/rename-dialog';
import { useAutomationsData } from '@/features/automations/hooks/use-automations-data';
import { useAutomationsDialogs } from '@/features/automations/hooks/use-automations-dialogs';
import { useAutomationsFilters } from '@/features/automations/hooks/use-automations-filters';
import { useAutomationsMutations } from '@/features/automations/hooks/use-automations-mutations';
import {
  useAutomationsSelection,
  hasMovableOrExportableItems,
} from '@/features/automations/hooks/use-automations-selection';
import { TreeItem } from '@/features/automations/lib/types';
import { appConnectionsQueries } from '@/features/connections/lib/app-connections-hooks';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { ImportTableDialog } from '@/features/tables/components/import-table-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { Permission, UncategorizedFolderId } from '@activepieces/shared';

export const AutomationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projectId: projectIdFromUrl } = useParams<{ projectId: string }>();
  const projectId = projectIdFromUrl ?? authenticationSession.getProjectId()!;

  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const userHasPermissionToWriteTable = checkAccess(Permission.WRITE_TABLE);
  const userHasPermissionToWriteFolder = checkAccess(Permission.WRITE_FOLDER);

  const {
    searchInput,
    handleSearchChange,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    connectionFilter,
    setConnectionFilter,
    ownerFilter,
    setOwnerFilter,
    filters,
    filtersActive,
    clearAllFilters,
  } = useAutomationsFilters(projectId);

  const {
    treeItems,
    folders,
    rootFlows,
    rootTables,
    isLoading,
    expandedFolders,
    loadingFolders,
    toggleFolder,
    loadMoreInFolder,
    rootPage,
    pageSize,
    changePageSize,
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
    filters.searchTerm,
    filters.typeFilter,
    filters.statusFilter,
    filters.connectionFilter,
    filters.ownerFilter,
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

  const dialogs = useAutomationsDialogs({ mutations, selectedItems });

  const { data: connections } = appConnectionsQueries.useAppConnections({
    request: { projectId, limit: 10000 },
    extraKeys: [projectId],
  });

  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { pieces } = piecesHooks.usePieces({});

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
        searchTerm={searchInput}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        connectionFilter={connectionFilter}
        onConnectionFilterChange={setConnectionFilter}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        connections={connections?.data}
        pieces={pieces}
        userHasPermissionToWriteFlow={userHasPermissionToWriteFlow}
        userHasPermissionToWriteTable={userHasPermissionToWriteTable}
        userHasPermissionToWriteFolder={userHasPermissionToWriteFolder}
        onCreateFlow={mutations.createFlow}
        onCreateTable={() => mutations.createTable(t('New Table'))}
        onCreateFolder={() => dialogs.setIsFolderDialogOpen(true)}
        onImportFlow={() => dialogs.setIsImportFlowDialogOpen(true)}
        onImportTable={() => dialogs.setIsImportTableDialogOpen(true)}
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
            folders={folders}
            selectableCount={selectableItems.length}
            onToggleAllSelection={toggleAllSelection}
            onToggleItemSelection={toggleItemSelection}
            onRowClick={handleRowClick}
            onRenameItem={dialogs.openRenameDialog}
            onDeleteItem={mutations.handleDeleteItem}
            onDuplicateFlow={mutations.handleDuplicateFlow}
            onMoveItem={mutations.handleMoveItem}
            onExportFlow={mutations.handleExportFlow}
            onExportTable={mutations.handleExportTable}
            isMoving={mutations.isMoving}
            isDuplicating={mutations.isDuplicating}
            onLoadMoreInFolder={loadMoreInFolder}
            isItemSelected={isItemSelected}
          />

          <AutomationsPagination
            currentPage={rootPage}
            totalItems={totalPageItems}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageSizeChange={changePageSize}
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
        onMoveClick={() => dialogs.setMoveToDialogOpen(true)}
        onDeleteClick={() => mutations.handleBulkDelete(selectedItems)}
        onExportClick={() => mutations.handleBulkExport(selectedItems)}
        onClearSelection={clearSelection}
      />

      <MoveToFolderDialog
        open={dialogs.moveToDialogOpen}
        onOpenChange={dialogs.setMoveToDialogOpen}
        folders={folders}
        selectedFolderId={dialogs.moveToFolderId}
        onFolderChange={dialogs.setMoveToFolderId}
        onConfirm={dialogs.handleBulkMoveTo}
        isMoving={mutations.isMoving}
      />

      <RenameDialog
        open={dialogs.renameDialogOpen}
        onOpenChange={dialogs.setRenameDialogOpen}
        value={dialogs.newName}
        onChange={dialogs.setNewName}
        onConfirm={dialogs.handleRename}
        isRenaming={mutations.isRenaming}
      />

      <CreateFolderDialog
        updateSearchParams={updateSearchParams}
        open={dialogs.isFolderDialogOpen}
        refetchFolders={() => invalidateAll()}
        onOpenChange={dialogs.setIsFolderDialogOpen}
      />

      <ImportFlowDialog
        insideBuilder={false}
        folderId={UncategorizedFolderId}
        onRefresh={() => invalidateAll()}
      >
        <button
          className="hidden"
          ref={(el) => {
            if (el && dialogs.isImportFlowDialogOpen) {
              el.click();
              dialogs.setIsImportFlowDialogOpen(false);
            }
          }}
        />
      </ImportFlowDialog>

      <ImportTableDialog
        open={dialogs.isImportTableDialogOpen}
        setIsOpen={dialogs.setIsImportTableDialogOpen}
        showTrigger={false}
        onImportSuccess={() => invalidateAll()}
      />
    </div>
  );
};
