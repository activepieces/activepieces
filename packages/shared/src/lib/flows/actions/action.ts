import { Type } from '@sinclair/typebox';

export enum ActionType {
  CODE = 'CODE',
  STORAGE = 'STORAGE',
  PIECE = 'PIECE',
  LOOP_ON_ITEMS = 'LOOP_ON_ITEMS',
}

interface BaseAction<T, V> {
  type: T;
  settings: V;
  displayName: string;
  name: string;
  valid: boolean;
  nextAction: BaseAction<any, any> | undefined;
}

// Code Action

export type CodeActionSettings = {
  artifact?: string;
  artifactSourceId: string | undefined;
  artifactPackagedId: string | undefined;
  input: Record<string, unknown>;
};

export type CodeAction = BaseAction<ActionType.CODE, CodeActionSettings>

export const CodeActionSchema = Type.Object({
  name: Type.String({}),
  displayName: Type.String({}),
  type: Type.Literal(ActionType.CODE),
  settings: Type.Object({
    artifactSourceId: Type.String({}),
    input: Type.Object({}),
  }),
});

// Piece Action
export type PieceActionSettings = {
  pieceName: string;
  actionName: string | undefined;
  input: Record<string, unknown>;
  customizedInputs: Map<string, boolean>
};

export type PieceAction = BaseAction<ActionType.PIECE, PieceActionSettings>

export const PieceActionSchema = Type.Object({
  name: Type.String({}),
  displayName: Type.String({}),
  type: Type.Literal(ActionType.PIECE),
  settings: Type.Object({
    pieceName: Type.String({}),
    actionName: Type.String({}),
    input: Type.Object({}),
  }),
});

// Storage Action

export enum StoreOperation {
  PUT = 'PUT',
  GET = 'GET',
}

export type StorageActionSettings = {
  operation: StoreOperation;
  key: string;
  value?: unknown;
};

export type StorageAction = BaseAction<ActionType.STORAGE, StorageActionSettings>

export const StorageActionSchema = Type.Union([
  Type.Object({
    name: Type.String({}),
    displayName: Type.String({}),
    type: Type.Literal(ActionType.STORAGE),
    settings: Type.Object({
      operation: Type.Literal(StoreOperation.PUT),
      key: Type.String({
        minLength: 1,
      }),
      value: Type.Any({}),
    }),
  }),
  Type.Object({
    name: Type.String({}),
    displayName: Type.String({}),
    type: Type.Literal(ActionType.STORAGE),
    settings: Type.Object({
      operation: Type.Literal(StoreOperation.GET),
      key: Type.String({
        minLength: 1,
      }),
    }),
  }),
]);

// Loop Items
export type LoopOnItemsActionSettings = {
  items: unknown;
};

export interface LoopOnItemsAction
  extends BaseAction<ActionType.LOOP_ON_ITEMS, LoopOnItemsActionSettings> {
  firstLoopAction: BaseAction<any, any> | undefined;
}

export const LoopOnItemsActionSchema = Type.Object({
  name: Type.String({}),
  displayName: Type.String({}),
  type: Type.Literal(ActionType.STORAGE),
  settings: Type.Object({
    items: Type.Array(Type.Any({})),
  }),
});

export type Action =
  | CodeAction
  | PieceAction
  | StorageAction
  | LoopOnItemsAction;
export const ActionSchema = Type.Union([
  CodeActionSchema,
  PieceActionSchema,
  StorageActionSchema,
  LoopOnItemsActionSchema,
]);
