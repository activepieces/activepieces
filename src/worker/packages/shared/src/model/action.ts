
interface BaseAction<T, V> {
  type: T;
  settings: V;
  displayName: string;
  name: string;
  valid: boolean;
  nextAction: BaseAction<any, any>;
}

export type Action = CodeAction | ComponentAction | StorageAction | LoopOnItemsAction;

export type CodeActionSettings = {
  artifactSourceId: string;
  artifactPackagedId: string;
  input: Record<string, unknown>;
}

export interface CodeAction extends BaseAction<ActionType.CODE, CodeActionSettings> {
}

export type ComponentActionSettings = {
  componentName: string;
  actionName: string;
  input: Record<string, unknown>;
}

export interface ComponentAction extends BaseAction<ActionType.COMPONENT, ComponentActionSettings> {
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
}


export enum ActionType {
  CODE = "CODE",
  STORAGE = "STORAGE",
  COMPONENT = "COMPONENT",
  LOOP_ON_ITEMS = "LOOP_ON_ITEMS"
}
