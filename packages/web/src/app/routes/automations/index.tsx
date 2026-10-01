import { Permission } from '@activepieces/core-utils';
import { FolderDto, UncategorizedFolderId } from '@activepieces/shared';
import { t } from 'i18next';
import { useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { recordAccess } from '@/app/components/global-search/access-history';
import {
  ProjectHeaderActions,
  ProjectHeaderMeta,
} from '@/app/components/project-layout/project-header-slots';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page } from '@/components/custom/page';
import { useEmbedding } from '@/components/providers/embed-provider';
import { AutomationsCreateButton } from '@/features/automations/components/automations-create-button';
import { AutomationsEmptyState } from '@/features/automations/components/automations-empty-state';
import { AutomationsFilters as AutomationsFiltersComponent } from '@/features/automations/components/automations-filters';
import { AutomationsFolderRail } from '@/features/automations/components/automations-folder-rail';
import { AutomationsNoResultsState } from '@/features/automations/components/automations-no-results-state';
import { AutomationsPagination } from '@/features/automations/components/automations-pagination';
import { AutomationsSelectionBar } from '@/features/automations/components/automations-selection-bar';
import { AutomationsTable } from '@/features/automations/components/automations-table';
import { CreateFolderDialog } from '@/features/automations/components/create-folder-dialog';
import { CreateInFolderKind } from '@/features/automations/components/create-new-menu';
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
import { usePinnedItems } from '@/features/automations/hooks/use-pinned-items';
import { AutomationsSort, TreeItem } from '@/features/automations/lib/types';
import { ROOT_ITEMS_LIMIT } from '@/features/automations/lib/utils';
import { appConnectionsQueries } from '@/features/connections';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { piecesHooks } from '@/features/pieces';
import { projectCollectionUtils, getProjectName } from '@/features/projects';
import { ImportTableDialog } from '@/features/tables/components/import-table-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';

export const AutomationsPage = () => {
  const { projectId: projectIdFromUrl } = useParams<{ projectId: string }>();
  const projectId = projectIdFromUrl ?? authenticationSession.getProjectId()!;

  return <AutomationsPageContent key={projectId} projectId={projectId} />;
};

const AutomationsPageContent = ({ projectId }: { projectId: string }) => {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { embedState } = useEmbedding();

  const { data: allProjects = [] } = projectCollectionUtils.useAll();
  const currentProjectName = (() => {
    const p = allProjects.find((proj) => proj.id === projectId);
    return p ? getProjectName(p) : null;
  })();

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
    folderFilter,
    setFolderFilter,
    sort,
    setSort,
    filters,
    filtersActive,
    clearAllFilters,
  } = useAutomationsFilters();

  const { pinnedList, isPinned, togglePin, unpinItem } = usePinnedItems();

  const {
    treeItems,
    folders,
    rootFlows,
    rootTables,
    isLoading,
    isError,
    isFiltered,
    expandedFolders,
    toggleFolder,
    loadMoreInFolder,
    rootPage,
    pageSize,
    changePageSize,
    totalPages,
    nextRootPage,
    prevRootPage,
    resetPagination,
    invalidateAll,
    invalidateRoot,
    invalidateFolder,
  } = useAutomationsData({ filters, pinnedList, sort });

  const expandFolderIfCollapsed = useCallback(
    (folderId: string) => {
      if (!expandedFolders.has(folderId)) {
        toggleFolder(folderId);
      }
    },
    [expandedFolders, toggleFolder],
  );

  const selectionItems = treeItems
    .filter((item) => item.type !== 'folder')
    .map((item) => ({ ...item, folderId: null }));

  const {
    selectedItems,
    toggleItemSelection,
    toggleAllSelection,
    clearSelection,
    isItemSelected,
    selectableItems,
  } = useAutomationsSelection(selectionItems);

  const mutations = useAutomationsMutations({
    invalidateAll,
    invalidateRoot,
    invalidateFolder,
    clearSelection,
    treeItems,
    unpinItem,
  });

  const dialogs = useAutomationsDialogs({ mutations, selectedItems });

  const { data: connections } = appConnectionsQueries.useAppConnections({
    request: { projectId, limit: 10000 },
    extraKeys: [projectId],
  });

  const { pieces } = piecesHooks.usePieces({});

  // Bulk actions resolve selected items from the loaded treeItems, so the
  // selection must never outlive the view that produced it. Clearing it on
  // every view change (filtering, paging, collapsing a folder) keeps the
  // selection a subset of what is currently loaded.
  const handleFiltersChange = useCallback(() => {
    clearSelection();
    resetPagination();
  }, [clearSelection, resetPagination]);

  const handleSortChange = useCallback(
    (next: AutomationsSort) => {
      setSort(next);
      handleFiltersChange();
    },
    [setSort, handleFiltersChange],
  );

  const handleNextPage = useCallback(() => {
    clearSelection();
    nextRootPage();
  }, [clearSelection, nextRootPage]);

  const handlePrevPage = useCallback(() => {
    clearSelection();
    prevRootPage();
  }, [clearSelection, prevRootPage]);

  const handlePageSizeChange = useCallback(
    (size: number) => {
      clearSelection();
      changePageSize(size);
    },
    [clearSelection, changePageSize],
  );

  const handleRowClick = useCallback(
    (item: TreeItem, ctrlKey?: boolean) => {
      if (item.type === 'folder') {
        if (expandedFolders.has(item.id)) {
          clearSelection();
        }
        toggleFolder(item.id);
      } else if (item.type === 'flow') {
        const href = authenticationSession.appendProjectRoutePrefix(
          `/flows/${item.id}`,
        );
        const flowData = item.data as {
          status?: 'ENABLED' | 'DISABLED';
        } | null;
        const folderName = item.folderId
          ? folders.find((f) => f.id === item.folderId)?.displayName ?? null
          : null;
        recordAccess({
          id: `flow-${item.id}`,
          type: 'flow',
          label: item.name,
          href,
          status: flowData?.status ?? null,
          folderName,
          projectName: currentProjectName,
        });
        if (ctrlKey) {
          window.open(href, '_blank');
        } else {
          navigate(href);
        }
      } else if (item.type === 'table') {
        const href = authenticationSession.appendProjectRoutePrefix(
          `/tables/${item.id}`,
        );
        const folderName = item.folderId
          ? folders.find((f) => f.id === item.folderId)?.displayName ?? null
          : null;
        recordAccess({
          id: `table-${item.id}`,
          type: 'table',
          label: item.name,
          href,
          folderName,
          projectName: currentProjectName,
        });
        if (ctrlKey) {
          window.open(href, '_blank');
        } else {
          navigate(href);
        }
      }
    },
    [
      navigate,
      toggleFolder,
      folders,
      currentProjectName,
      clearSelection,
      expandedFolders,
    ],
  );

  const handleCreateInFolder = useCallback(
    (folderId: string, kind: CreateInFolderKind) => {
      switch (kind) {
        case 'flow':
          mutations.createFlow(folderId);
          break;
        case 'table':
          mutations.createTable(t('New Table'), folderId);
          break;
        case 'import-flow':
          expandFolderIfCollapsed(folderId);
          dialogs.setImportTargetFolderId(folderId);
          dialogs.setIsImportFlowDialogOpen(true);
          break;
        case 'import-table':
          expandFolderIfCollapsed(folderId);
          dialogs.setImportTargetFolderId(folderId);
          dialogs.setIsImportTableDialogOpen(true);
          break;
      }
    },
    [expandFolderIfCollapsed, mutations, dialogs],
  );

  const updateSearchParams = (newFolderId: string | undefined) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (newFolderId) {
          newParams.set('folderId', newFolderId);
        } else {
          newParams.delete('folderId');
        }
        return newParams;
      },
      { replace: true },
    );
  };

  const hideTables = embedState.hideTables;
  const showFolderRail = !embedState.hideFolders;
  const countsCache = useRef<ItemCounts | null>(null);
  if (!isFiltered && !isLoading && !isError) {
    countsCache.current = {
      flows:
        rootFlows.length +
        folders.reduce((sum, folder) => sum + folder.numberOfFlows, 0),
      tables: hideTables
        ? 0
        : rootTables.length +
          folders.reduce((sum, folder) => sum + folder.numberOfTables, 0),
    };
  }
  const counts = countsCache.current;

  const selectedFolderId =
    folderFilter.length === 0
      ? null
      : folderFilter.length === 1
      ? folderFilter[0]
      : undefined;

  const handleSelectFolder = (folderId: string | null) => {
    setFolderFilter(folderId ? [folderId] : []);
    handleFiltersChange();
  };

  const createButton = (
    <AutomationsCreateButton
      userHasPermissionToWriteFlow={userHasPermissionToWriteFlow}
      userHasPermissionToWriteTable={userHasPermissionToWriteTable}
      userHasPermissionToWriteFolder={userHasPermissionToWriteFolder}
      isCreatingFlow={mutations.isCreateFlowPending}
      isCreatingTable={mutations.isCreatingTable}
      onCreateFlow={() => mutations.createFlow()}
      onCreateTable={() => mutations.createTable(t('New table'))}
      onCreateFolder={() => dialogs.setIsFolderDialogOpen(true)}
      onImportFlow={() => {
        dialogs.setImportTargetFolderId(undefined);
        dialogs.setIsImportFlowDialogOpen(true);
      }}
      onImportTable={() => {
        dialogs.setImportTargetFolderId(undefined);
        dialogs.setIsImportTableDialogOpen(true);
      }}
    />
  );

  const meta = counts && (
    <span className="tabular-nums">
      {hideTables
        ? t('{flows, plural, =1 {1 flow} other {# flows}}', {
            flows: counts.flows,
          })
        : t(
            '{flows, plural, =1 {1 flow} other {# flows}} · {tables, plural, =1 {1 table} other {# tables}}',
            { flows: counts.flows, tables: counts.tables },
          )}
    </span>
  );

  const hasAnyItems =
    rootFlows.length > 0 || rootTables.length > 0 || folders.length > 0;
  const isSortTruncated =
    sort !== 'default' &&
    (rootFlows.length >= ROOT_ITEMS_LIMIT ||
      rootTables.length >= ROOT_ITEMS_LIMIT);
  const isErrorState = isError && !hasAnyItems && !isLoading;
  const isEmptyState =
    !hasAnyItems && !isLoading && !filtersActive && !isErrorState;
  const isNoResultsState =
    treeItems.length === 0 && filtersActive && !isLoading && !isErrorState;

  const dialogsNode = (
    <>
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
        key={dialogs.importTargetFolderId ?? 'root-import-flow'}
        insideBuilder={false}
        folderId={dialogs.importTargetFolderId ?? UncategorizedFolderId}
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

      {!embedState.hideTables && (
        <ImportTableDialog
          open={dialogs.isImportTableDialogOpen}
          setIsOpen={(open) => {
            dialogs.setIsImportTableDialogOpen(open);
            if (!open) dialogs.setImportTargetFolderId(undefined);
          }}
          showTrigger={false}
          folderId={dialogs.importTargetFolderId}
          onImportSuccess={() => invalidateAll()}
        />
      )}
    </>
  );

  if (isEmptyState) {
    return (
      <Page>
        <ProjectHeaderActions>{createButton}</ProjectHeaderActions>
        <AutomationsEmptyState onRefresh={() => invalidateAll()} />
        {dialogsNode}
      </Page>
    );
  }

  return (
    <Page>
      <ProjectHeaderMeta>{meta}</ProjectHeaderMeta>
      <ProjectHeaderActions>{createButton}</ProjectHeaderActions>
      <div className="flex min-w-0 gap-8">
        {showFolderRail && (
          <AutomationsFolderRail
            folders={folders}
            totalCount={counts ? counts.flows + counts.tables : null}
            selectedFolderId={selectedFolderId}
            hideTables={hideTables}
            isPinned={isPinned}
            userHasPermissionToWriteFlow={userHasPermissionToWriteFlow}
            userHasPermissionToWriteTable={userHasPermissionToWriteTable}
            userHasPermissionToWriteFolder={userHasPermissionToWriteFolder}
            onSelect={handleSelectFolder}
            onCreateFolder={() => dialogs.setIsFolderDialogOpen(true)}
            onCreateInFolder={handleCreateInFolder}
            onRename={(folder) =>
              dialogs.openRenameDialog(folderToTreeItem(folder))
            }
            onDelete={(folder) =>
              mutations.handleDeleteItem(folderToTreeItem(folder))
            }
            onTogglePin={togglePin}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
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
            folderFilter={folderFilter}
            onFolderFilterChange={setFolderFilter}
            onFilterChange={handleFiltersChange}
            folders={folders}
            connections={connections?.data}
            pieces={pieces}
            showFolderFilter={!showFolderRail}
            onClearAllFilters={clearAllFilters}
            hasActiveFilters={filtersActive}
          />

          {isErrorState ? (
            <DataFetchErrorState
              entity={t('automations')}
              onRetry={invalidateAll}
              className="py-16"
            />
          ) : isNoResultsState ? (
            <AutomationsNoResultsState onClearFilters={clearAllFilters} />
          ) : (
            <>
              <AutomationsTable
                items={treeItems}
                isLoading={isLoading}
                selectedItems={selectedItems}
                folders={folders}
                showFolderName={folderFilter.length !== 1}
                selectableCount={selectableItems.length}
                isPinned={isPinned}
                onTogglePin={togglePin}
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
                sort={sort}
                onSortChange={handleSortChange}
              />

              <div className="flex items-center justify-end gap-4">
                {isSortTruncated && (
                  <span className="text-sm text-gray-11">
                    {t('Showing the first {count}', {
                      count: rootFlows.length + rootTables.length,
                    })}
                  </span>
                )}
                <AutomationsPagination
                  currentPage={rootPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

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

      {dialogsNode}
    </Page>
  );
};

function folderToTreeItem(folder: FolderDto): TreeItem {
  return {
    id: folder.id,
    type: 'folder',
    name: folder.displayName,
    data: folder,
    depth: 0,
    folderId: null,
  };
}

type ItemCounts = { flows: number; tables: number };
