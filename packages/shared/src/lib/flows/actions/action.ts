import { Type } from '@sinclair/typebox';

export enum ActionType {
  CODE = 'CODE',
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
  inputUiInfo: Record<string, unknown>
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
    inputUiInfo: Type.Record(Type.String({}), Type.Any())
  }),
});


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
  type: Type.Literal(ActionType.LOOP_ON_ITEMS),
  settings: Type.Object({
    items: Type.Array(Type.Any({})),
  }),
});

export type Action =
  | CodeAction
  | PieceAction
  | LoopOnItemsAction;
export const ActionSchema = Type.Union([
  CodeActionSchema,
  PieceActionSchema,
  LoopOnItemsActionSchema,
]);
