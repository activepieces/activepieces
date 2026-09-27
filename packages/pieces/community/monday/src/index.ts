import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createColumnAction } from './lib/actions/create-column';
import { createGroupAction } from './lib/actions/create-group';
import { createItemAction } from './lib/actions/create-item';
import { createUpdateAction } from './lib/actions/create-update';
import { getBoardItemValuesAction } from './lib/actions/get-board-values';
import { getItemsColumnValuesAction } from './lib/actions/get-column-values';
import { updateColumnValuesOfItemAction } from './lib/actions/update-column-values-of-item';
import { updateItemNameAction } from './lib/actions/update-item-name';
import { newItemInBoardTrigger } from './lib/triggers/new-item-in-board';
import { specificColumnValueUpdatedTrigger } from './lib/triggers/specific-column-updated';
import { uploadFileToColumnAction } from './lib/actions/upload-file-to-column';
import { mondayAuth } from './lib/auth';
import { addTeamsToBoardAction } from './lib/actions/ai/boards/add-teams-to-board';
import { addUsersToBoardAction } from './lib/actions/ai/boards/add-users-to-board';
import { archiveBoardAction } from './lib/actions/ai/boards/archive-board';
import { createBoardAction } from './lib/actions/ai/boards/create-board';
import { deleteBoardAction } from './lib/actions/ai/boards/delete-board';
import { duplicateBoardAction } from './lib/actions/ai/boards/duplicate-board';
import { getBoardActivityLogsAction } from './lib/actions/ai/boards/get-board-activity-logs';
import { listBoardViewsAction } from './lib/actions/ai/boards/list-board-views';
import { listBoardsAction } from './lib/actions/ai/boards/list-boards';
import { removeBoardSubscribersAction } from './lib/actions/ai/boards/remove-board-subscribers';
import { removeTeamsFromBoardAction } from './lib/actions/ai/boards/remove-teams-from-board';
import { updateBoardHierarchyAction } from './lib/actions/ai/boards/update-board-hierarchy';
import { updateBoardAction } from './lib/actions/ai/boards/update-board';
import { addBoardColumnAction } from './lib/actions/ai/columns/add-board-column';
import { deleteColumnAction } from './lib/actions/ai/columns/delete-column';
import { getColumnTypeSchemaAction } from './lib/actions/ai/columns/get-column-type-schema';
import { listColumnsAction } from './lib/actions/ai/columns/list-columns';
import { updateColumnAction } from './lib/actions/ai/columns/update-column';
import { appendMarkdownToDocAction } from './lib/actions/ai/docs/append-markdown-to-doc';
import { createDocBlockAction } from './lib/actions/ai/docs/create-doc-block';
import { createDocAction } from './lib/actions/ai/docs/create-doc';
import { deleteDocBlockAction } from './lib/actions/ai/docs/delete-doc-block';
import { deleteDocAction } from './lib/actions/ai/docs/delete-doc';
import { duplicateDocAction } from './lib/actions/ai/docs/duplicate-doc';
import { exportDocAsMarkdownAction } from './lib/actions/ai/docs/export-doc-as-markdown';
import { getDocBlocksAction } from './lib/actions/ai/docs/get-doc-blocks';
import { importDocFromHtmlAction } from './lib/actions/ai/docs/import-doc-from-html';
import { listDocsAction } from './lib/actions/ai/docs/list-docs';
import { renameDocAction } from './lib/actions/ai/docs/rename-doc';
import { updateDocBlockAction } from './lib/actions/ai/docs/update-doc-block';
import { getAssetsAction } from './lib/actions/ai/files/get-assets';
import { uploadFileAction } from './lib/actions/ai/files/upload-file';
import { createFolderAction } from './lib/actions/ai/folders/create-folder';
import { deleteFolderAction } from './lib/actions/ai/folders/delete-folder';
import { listFoldersAction } from './lib/actions/ai/folders/list-folders';
import { updateFolderAction } from './lib/actions/ai/folders/update-folder';
import { addBoardGroupAction } from './lib/actions/ai/groups/add-board-group';
import { archiveGroupAction } from './lib/actions/ai/groups/archive-group';
import { deleteGroupAction } from './lib/actions/ai/groups/delete-group';
import { duplicateGroupAction } from './lib/actions/ai/groups/duplicate-group';
import { listGroupsAction } from './lib/actions/ai/groups/list-groups';
import { updateGroupAction } from './lib/actions/ai/groups/update-group';
import { archiveItemAction } from './lib/actions/ai/items/archive-item';
import { changeColumnValueAction } from './lib/actions/ai/items/change-column-value';
import { changeItemPositionAction } from './lib/actions/ai/items/change-item-position';
import { changeSimpleColumnValueAction } from './lib/actions/ai/items/change-simple-column-value';
import { clearItemUpdatesAction } from './lib/actions/ai/items/clear-item-updates';
import { createBoardItemAction } from './lib/actions/ai/items/create-board-item';
import { createSubitemAction } from './lib/actions/ai/items/create-subitem';
import { deleteItemAction } from './lib/actions/ai/items/delete-item';
import { duplicateItemAction } from './lib/actions/ai/items/duplicate-item';
import { getItemsAction } from './lib/actions/ai/items/get-items';
import { listBoardItemsAction } from './lib/actions/ai/items/list-board-items';
import { listSubitemsAction } from './lib/actions/ai/items/list-subitems';
import { moveItemToBoardAction } from './lib/actions/ai/items/move-item-to-board';
import { moveItemToGroupAction } from './lib/actions/ai/items/move-item-to-group';
import { renameItemAction } from './lib/actions/ai/items/rename-item';
import { searchItemsByColumnValuesAction } from './lib/actions/ai/items/search-items-by-column-values';
import { setItemColumnValuesAction } from './lib/actions/ai/items/set-item-column-values';
import { updateAssetsOnItemAction } from './lib/actions/ai/items/update-assets-on-item';
import { aggregateBoardDataAction } from './lib/actions/ai/other/aggregate-board-data';
import { createOrGetTagAction } from './lib/actions/ai/other/create-or-get-tag';
import { getBoardMuteSettingsAction } from './lib/actions/ai/other/get-board-mute-settings';
import { getFavoritesAction } from './lib/actions/ai/other/get-favorites';
import { getFormAction } from './lib/actions/ai/other/get-form';
import { listNotificationsAction } from './lib/actions/ai/other/list-notifications';
import { listTagsAction } from './lib/actions/ai/other/list-tags';
import { searchAction } from './lib/actions/ai/other/search';
import { sendNotificationAction } from './lib/actions/ai/other/send-notification';
import { updateBoardMuteSettingsAction } from './lib/actions/ai/other/update-board-mute-settings';
import { deleteUpdateAction } from './lib/actions/ai/updates/delete-update';
import { editUpdateAction } from './lib/actions/ai/updates/edit-update';
import { likeUpdateAction } from './lib/actions/ai/updates/like-update';
import { listBoardUpdatesAction } from './lib/actions/ai/updates/list-board-updates';
import { listItemUpdatesAction } from './lib/actions/ai/updates/list-item-updates';
import { pinUpdateAction } from './lib/actions/ai/updates/pin-update';
import { postItemUpdateAction } from './lib/actions/ai/updates/post-item-update';
import { unlikeUpdateAction } from './lib/actions/ai/updates/unlike-update';
import { unpinUpdateAction } from './lib/actions/ai/updates/unpin-update';
import { getAccountAction } from './lib/actions/ai/users/get-account';
import { getMeAction } from './lib/actions/ai/users/get-me';
import { listTeamsAction } from './lib/actions/ai/users/list-teams';
import { listUsersAction } from './lib/actions/ai/users/list-users';
import { addTeamsToWorkspaceAction } from './lib/actions/ai/workspaces/add-teams-to-workspace';
import { addUsersToWorkspaceAction } from './lib/actions/ai/workspaces/add-users-to-workspace';
import { createWorkspaceAction } from './lib/actions/ai/workspaces/create-workspace';
import { deleteTeamsFromWorkspaceAction } from './lib/actions/ai/workspaces/delete-teams-from-workspace';
import { deleteUsersFromWorkspaceAction } from './lib/actions/ai/workspaces/delete-users-from-workspace';
import { deleteWorkspaceAction } from './lib/actions/ai/workspaces/delete-workspace';
import { listWorkspacesAction } from './lib/actions/ai/workspaces/list-workspaces';
import { updateWorkspaceAction } from './lib/actions/ai/workspaces/update-workspace';

export const monday = createPiece({
  displayName: 'monday.com',
  description: 'Work operating system for businesses',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/monday.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'kanarelo',
    'haseebrehmanpc',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
  ],
  auth: mondayAuth,
  actions: [
    createColumnAction,
    createGroupAction,
    createItemAction,
    createUpdateAction,
    getBoardItemValuesAction,
    getItemsColumnValuesAction,
    updateColumnValuesOfItemAction,
    updateItemNameAction,
    uploadFileToColumnAction,
    addTeamsToBoardAction,
    addUsersToBoardAction,
    archiveBoardAction,
    createBoardAction,
    deleteBoardAction,
    duplicateBoardAction,
    getBoardActivityLogsAction,
    listBoardViewsAction,
    listBoardsAction,
    removeBoardSubscribersAction,
    removeTeamsFromBoardAction,
    updateBoardHierarchyAction,
    updateBoardAction,
    addBoardColumnAction,
    deleteColumnAction,
    getColumnTypeSchemaAction,
    listColumnsAction,
    updateColumnAction,
    appendMarkdownToDocAction,
    createDocBlockAction,
    createDocAction,
    deleteDocBlockAction,
    deleteDocAction,
    duplicateDocAction,
    exportDocAsMarkdownAction,
    getDocBlocksAction,
    importDocFromHtmlAction,
    listDocsAction,
    renameDocAction,
    updateDocBlockAction,
    getAssetsAction,
    uploadFileAction,
    createFolderAction,
    deleteFolderAction,
    listFoldersAction,
    updateFolderAction,
    addBoardGroupAction,
    archiveGroupAction,
    deleteGroupAction,
    duplicateGroupAction,
    listGroupsAction,
    updateGroupAction,
    archiveItemAction,
    changeColumnValueAction,
    changeItemPositionAction,
    changeSimpleColumnValueAction,
    clearItemUpdatesAction,
    createBoardItemAction,
    createSubitemAction,
    deleteItemAction,
    duplicateItemAction,
    getItemsAction,
    listBoardItemsAction,
    listSubitemsAction,
    moveItemToBoardAction,
    moveItemToGroupAction,
    renameItemAction,
    searchItemsByColumnValuesAction,
    setItemColumnValuesAction,
    updateAssetsOnItemAction,
    aggregateBoardDataAction,
    createOrGetTagAction,
    getBoardMuteSettingsAction,
    getFavoritesAction,
    getFormAction,
    listNotificationsAction,
    listTagsAction,
    searchAction,
    sendNotificationAction,
    updateBoardMuteSettingsAction,
    deleteUpdateAction,
    editUpdateAction,
    likeUpdateAction,
    listBoardUpdatesAction,
    listItemUpdatesAction,
    pinUpdateAction,
    postItemUpdateAction,
    unlikeUpdateAction,
    unpinUpdateAction,
    getAccountAction,
    getMeAction,
    listTeamsAction,
    listUsersAction,
    addTeamsToWorkspaceAction,
    addUsersToWorkspaceAction,
    createWorkspaceAction,
    deleteTeamsFromWorkspaceAction,
    deleteUsersFromWorkspaceAction,
    deleteWorkspaceAction,
    listWorkspacesAction,
    updateWorkspaceAction,
  ],
  triggers: [newItemInBoardTrigger, specificColumnValueUpdatedTrigger],
});
