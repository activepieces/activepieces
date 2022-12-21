import {Step} from "./step";

export interface Action<T, V> extends Step<T, V> {
}

export type CodeActionSettings = {
  artifactSourceId: string;
  artifactPackagedId: string;
  input: Record<string, unknown>;
}

export interface CodeAction extends Action<ActionType.CODE, CodeActionSettings> {
}

export type ComponentActionSettings = {
  componentName: string;
  actionName: string;
  input: Record<string, unknown>;
}

export interface ComponentAction extends Action<ActionType.COMPONENT, ComponentActionSettings> {
};

export type ResponseActionSettings = {
  output: Record<string, unknown>;
}

export interface ResponseAction extends Action<ActionType.RESPONSE, ResponseActionSettings> {
}

export enum StoreOperation {
  PUT = "PUT",
  GET = "GET"
}

export type StorageActionSettings = {
  operation: StoreOperation,
  key: string;
  value: unknown;
}

export interface StorageAction extends Action<ActionType.STORAGE, StorageActionSettings> {
}


export type LoopOnItemsActionSettings = {
  items: unknown;
}

export interface LoopOnItemsAction extends Action<ActionType.LOOP_ON_ITEMS, LoopOnItemsActionSettings> {
}


export enum ActionType {
  CODE = "CODE",
  STORAGE = "STORAGE",
  RESPONSE = "RESPONSE",
  COMPONENT = "COMPONENT",
  LOOP_ON_ITEMS = "LOOP_ON_ITEMS"
}
