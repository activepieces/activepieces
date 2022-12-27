

export type Action = CodeAction | PieceAction | StorageAction | LoopOnItemsAction;


interface BaseAction<T, V> {
  type: T;
  settings: V;
  displayName: string;
  name: string;
  valid: boolean;
  nextAction: BaseAction<any, any> | undefined;
}

export type CodeActionSettings = {
  artifact?: string;
  artifactSourceId: string;
  artifactPackagedId: string | undefined;
  input: Record<string, unknown>;
}

export interface CodeAction extends BaseAction<ActionType.CODE, CodeActionSettings> {
}

export type PieceActionSettings = {
  pieceName: string;
  actionName: string;
  input: Record<string, unknown>;
}

export interface PieceAction extends BaseAction<ActionType.PIECE, PieceActionSettings> {
};

export enum StoreOperation {
  PUT = "PUT",
  GET = "GET"
}

export type StorageActionSettings = {
  operation: StoreOperation,
  key: string;
  value: unknown;
}

export interface StorageAction extends BaseAction<ActionType.STORAGE, StorageActionSettings> {
}


export type LoopOnItemsActionSettings = {
  items: unknown;
}

export interface LoopOnItemsAction extends BaseAction<ActionType.LOOP_ON_ITEMS, LoopOnItemsActionSettings> {
  firstLoopAction: BaseAction<any, any> | undefined;
}


export enum ActionType {
  CODE = "CODE",
  STORAGE = "STORAGE",
  PIECE = "PIECE",
  LOOP_ON_ITEMS = "LOOP_ON_ITEMS"
}
