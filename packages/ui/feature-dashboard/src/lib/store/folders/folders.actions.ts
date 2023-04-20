import { FoldersListDto } from '@activepieces/shared';
import { createAction, props } from '@ngrx/store';

export enum FoldersActionType {
  INITIALISE = 'INITIALISE',
  ADD_FOLDER = 'ADD_FOLDER',
  DELETE_FOLDER = 'DELETE_FOLDER',
  RENAME_FOLDER = 'RENAME_FOLDER',
  SELECT_FOLDER = 'SELECT_FOLDER',
  SHOW_ALL_FLOWS = 'SHOW_ALL_FLOWS',
}

const setInitial = createAction(
  FoldersActionType.INITIALISE,
  props<{
    folders: FoldersListDto[];
    allFlowsNumber: number;
    uncategorizedFlowsNumber: number;
    selectedFolderId:string
  }>()
);

const addFolder = createAction(
  FoldersActionType.ADD_FOLDER,
  props<{ folder: FoldersListDto }>()
);

const deleteFolder = createAction(
  FoldersActionType.DELETE_FOLDER,
  props<{ folderId: string }>()
);

const selectFolder = createAction(
  FoldersActionType.SELECT_FOLDER,
  props<{ folderId?: string }>()
);
const renameFolder = createAction(
  FoldersActionType.RENAME_FOLDER,
  props<{ folderId: string; newName: string }>()
);
const showAllFlows = createAction(FoldersActionType.SHOW_ALL_FLOWS);

export const FolderActions = {
  setInitial,
  addFolder,
  deleteFolder,
  renameFolder,
  selectFolder,
  showAllFlows,
};
