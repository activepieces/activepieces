import { FolderDto } from '@activepieces/shared';
import { createAction, props } from '@ngrx/store';

export enum FoldersActionType {
  INITIALISE = '[FOLDERS] INITIALISE',
  ADD_FOLDER = '[FOLDERS] ADD_FOLDER',
  DELETE_FOLDER = '[FOLDERS] DELETE_FOLDER',
  RENAME_FOLDER = '[FOLDERS] RENAME_FOLDER',
  SELECT_FOLDER = '[FOLDERS] SELECT_FOLDER',
  SHOW_ALL_FLOWS = '[FOLDERS] SHOW_ALL_FLOWS',
  DELETE_FLOW = '[FOLDERS] DELETE_FLOW',
  MOVE_FLOW_IN_FLOWS_TABLE = '[FOLDERS] MOVE_FLOW_IN_FLOWS_TABLE',
  MOVE_FLOW_IN_BUILDER = '`',
}

const setInitial = createAction(
  FoldersActionType.INITIALISE,
  props<{
    folders: FolderDto[];
    allFlowsNumber: number;
    uncategorizedFlowsNumber: number;
    selectedFolderId?: string;
  }>()
);

const addFolder = createAction(
  FoldersActionType.ADD_FOLDER,
  props<{ folder: FolderDto }>()
);

const deleteFolder = createAction(
  FoldersActionType.DELETE_FOLDER,
  props<{ folderId: string }>()
);
const deleteFlow = createAction(
  FoldersActionType.DELETE_FLOW,
  props<{ flowDisplayName: string }>()
);
const selectFolder = createAction(
  FoldersActionType.SELECT_FOLDER,
  props<{ folderId?: string }>()
);
const moveFlowInFlowsTable = createAction(
  FoldersActionType.MOVE_FLOW_IN_FLOWS_TABLE,
  props<{ targetFolderId: string; flowFolderId?: string | null }>()
);
const moveFlowInBuilder = createAction(
  FoldersActionType.MOVE_FLOW_IN_BUILDER,
  props<{ targetFolderId: string; flowFolderId?: string | null }>()
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
  deleteFlow,
  moveFlowInFlowsTable,
  moveFlowInBuilder,
};
