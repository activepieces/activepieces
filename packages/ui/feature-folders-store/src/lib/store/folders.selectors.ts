import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FoldersState } from './folders.reducer';

export const FOLDERS_STATE_NAME = 'FoldersState';

export const selectFoldersState =
  createFeatureSelector<FoldersState>(FOLDERS_STATE_NAME);

const selectDisplayAllFlows = createSelector(selectFoldersState, (state) => {
  return state.displayAllFlows;
});

const selectCurrentFolder = createSelector(selectFoldersState, (state) => {
  return state.selectedFolder;
});
const selectCurrentFolderId = createSelector(
  selectCurrentFolder,
  (selectedFolder) => {
    return selectedFolder?.id;
  }
);

const selectCurrentFolderName = createSelector(
  selectCurrentFolder,
  (selectedFolder) => {
    return selectedFolder?.displayName || $localize`Uncategorized`;
  }
);

const selectFolders = createSelector(selectFoldersState, (state) => {
  return state.folders;
});
const selectFoldersAsc = createSelector(selectFoldersState, (state) => {
  const folders = [...state.folders];
  return folders.sort((a, b) => a.displayName.localeCompare(b.displayName));
});
const selectFoldersDesc = createSelector(selectFoldersState, (state) => {
  const folders = [...state.folders];
  return folders.sort((a, b) => b.displayName.localeCompare(a.displayName));
});
const selectAllFlowsNumber = createSelector(selectFoldersState, (state) => {
  return state.allFlowsNumber;
});
const selectUncategorizedFlowsNumber = createSelector(
  selectFoldersState,
  (state) => {
    return state.uncategorizedFlowsNumber;
  }
);
const selectCurrentFolderExceptCurrent = createSelector(
  selectFoldersState,
  (state) => {
    return state.folders.filter((f) => f.id !== state.selectedFolder?.id);
  }
);

export const FoldersSelectors = {
  selectDisplayAllFlows,
  selectCurrentFolder,
  selectFoldersAsc,
  selectFoldersDesc,
  selectFolders,
  selectAllFlowsNumber,
  selectUncategorizedFlowsNumber,
  selectCurrentFolderExceptCurrent,
  selectCurrentFolderId,
  selectCurrentFolderName,
};
