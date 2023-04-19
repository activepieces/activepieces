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

const selectFolders = createSelector(selectFoldersState, (state) => {
  return state.folders;
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

export const FoldersSelectors = {
  selectDisplayAllFlows,
  selectCurrentFolder,
  selectFolders,
  selectAllFlowsNumber,
  selectUncategorizedFlowsNumber,
};
