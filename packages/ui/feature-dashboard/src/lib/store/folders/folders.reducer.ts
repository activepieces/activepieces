import { FoldersListDto } from '@activepieces/shared';
import { Action, createReducer, on } from '@ngrx/store';
import { FolderActions } from './folders.actions';

export type FoldersState = {
  folders: FoldersListDto[];
  selectedFolder?: FoldersListDto;
  displayAllFlows: boolean;
  allFlowsNumber: number;
  uncategorizedFlowsNumber: number;
};

const initialState: FoldersState = {
  folders: [],
  displayAllFlows: true,
  allFlowsNumber: 0,
  uncategorizedFlowsNumber: 0,
};

const _foldersReducer = createReducer(
  initialState,
  on(
    FolderActions.setInitial,
    (
      state,
      { folders, allFlowsNumber, uncategorizedFlowsNumber }
    ): FoldersState => {
      return {
        displayAllFlows: true,
        folders,
        selectedFolder: undefined,
        allFlowsNumber,
        uncategorizedFlowsNumber,
      };
    }
  ),
  on(FolderActions.deleteFolder, (state, { folderId }): FoldersState => {
    const idx = state.folders.findIndex((f) => (f.id = folderId));
    if (idx > -1) {
      const folders = [...state.folders];
      folders.splice(idx, 1);
      return {
        ...state,
        folders: folders,
        displayAllFlows: true,
        selectedFolder: undefined,
      };
    }
    return state;
  }),
  on(
    FolderActions.renameFolder,
    (state, { folderId, newName }): FoldersState => {
      const idx = state.folders.findIndex((f) => (f.id = folderId));
      if (idx > -1) {
        const folders = [...state.folders];
        folders[idx].displayName = newName;
        return {
          ...state,
          folders: folders,
          displayAllFlows: false,
          selectedFolder: folders[idx],
        };
      }
      return state;
    }
  ),
  on(FolderActions.addFolder, (state, { folder }): FoldersState => {
    const folders = [...state.folders, folder];
    return {
      ...state,
      folders,
      displayAllFlows: false,
      selectedFolder: folder,
    };
  }),
  on(FolderActions.selectFolder, (state, { folderId }): FoldersState => {
    const folder = state.folders.find((f) => f.id === folderId);
    return {
      ...state,
      selectedFolder: folder,
      displayAllFlows: false,
    };
  }),
  on(FolderActions.showAllFlows, (state): FoldersState => {
    return {
      ...state,
      displayAllFlows: true,
      selectedFolder: undefined,
    };
  })
);
export function foldersReducer(
  state: FoldersState | undefined,
  action: Action
) {
  return _foldersReducer(state, action);
}
