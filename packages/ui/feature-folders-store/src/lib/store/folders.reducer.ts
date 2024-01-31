import { FolderDto } from '@activepieces/shared';
import { Action, createReducer, on } from '@ngrx/store';
import { FolderActions } from './folders.actions';

export type FoldersState = {
  folders: FolderDto[];
  selectedFolder?: FolderDto;
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
      { folders, allFlowsNumber, uncategorizedFlowsNumber, selectedFolderId }
    ): FoldersState => {
      const selectedFolder = folders.find((f) => f.id === selectedFolderId);
      return {
        displayAllFlows: !selectedFolder && selectedFolderId !== 'NULL',
        folders,
        selectedFolder: selectedFolder,
        allFlowsNumber,
        uncategorizedFlowsNumber,
      };
    }
  ),
  on(FolderActions.deleteFolder, (state, { folderId }): FoldersState => {
    const idx = state.folders.findIndex((f) => f.id === folderId);
    if (idx > -1) {
      const folders = [...state.folders];
      const folder = folders[idx];
      const uncategorizedFlowsNumber =
        state.uncategorizedFlowsNumber + folder.numberOfFlows;
      const showAllFolders =
        folder.id === state.selectedFolder?.id || state.displayAllFlows;
      folders.splice(idx, 1);
      return {
        ...state,
        folders: folders,
        displayAllFlows: showAllFolders,
        selectedFolder: showAllFolders ? undefined : state.selectedFolder,
        uncategorizedFlowsNumber: uncategorizedFlowsNumber,
      };
    }
    return state;
  }),
  on(
    FolderActions.renameFolder,
    (state, { folderId, newName }): FoldersState => {
      const idx = state.folders.findIndex((f) => f.id === folderId);
      if (idx > -1) {
        const folders = [...state.folders];
        folders[idx] = { ...folders[idx], displayName: newName };
        return {
          ...state,
          folders: folders,
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
  }),
  on(FolderActions.deleteFlow, (state): FoldersState => {
    const allFlowsNumber = state.allFlowsNumber - 1;
    const uncategorizedFlowsNumber = state.selectedFolder
      ? state.uncategorizedFlowsNumber
      : state.uncategorizedFlowsNumber - 1;
    if (state.selectedFolder === undefined) {
      return {
        ...state,
        allFlowsNumber,
        uncategorizedFlowsNumber,
      };
    } else {
      const folders = [...state.folders];
      const selectedFolderIdx = folders.findIndex(
        (f) => f.id === state.selectedFolder?.id
      );
      folders[selectedFolderIdx] = {
        ...folders[selectedFolderIdx],
        numberOfFlows: folders[selectedFolderIdx].numberOfFlows - 1,
      };
      return {
        ...state,
        folders,
        selectedFolder: folders[selectedFolderIdx],
      };
    }
  }),
  on(
    FolderActions.moveFlowInFlowsTable,
    (state, { targetFolderId, flowFolderId }) => {
      const folders = [...state.folders];
      let uncategorizedFlowsNumber = state.uncategorizedFlowsNumber;

      const targetFolderIndex = folders.findIndex(
        (f) => f.id === targetFolderId
      );
      const currentlySelectedFolderIndex = !state.displayAllFlows
        ? folders.findIndex((f) => f.id === state.selectedFolder?.id)
        : folders.findIndex((f) => f.id === flowFolderId);

      if (targetFolderIndex < 0) {
        uncategorizedFlowsNumber++;
      } else {
        folders[targetFolderIndex] = {
          ...folders[targetFolderIndex],
          numberOfFlows: folders[targetFolderIndex].numberOfFlows + 1,
        };
      }
      if (currentlySelectedFolderIndex < 0) {
        uncategorizedFlowsNumber--;
      } else {
        folders[currentlySelectedFolderIndex] = {
          ...folders[currentlySelectedFolderIndex],
          numberOfFlows:
            folders[currentlySelectedFolderIndex].numberOfFlows - 1,
        };
      }
      return {
        ...state,
        folders: folders,
        uncategorizedFlowsNumber,
      };
    }
  )
);
export function foldersReducer(
  state: FoldersState | undefined,
  action: Action
) {
  return _foldersReducer(state, action);
}
