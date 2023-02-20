import { Type, Static } from '@sinclair/typebox';

export enum ActionType {
  CODE = 'CODE',
  PIECE = 'PIECE',
  LOOP_ON_ITEMS = 'LOOP_ON_ITEMS',
}

const commonActionProps = {
  name: Type.String({}),
  valid: Type.Boolean({}),
  displayName: Type.String({}),
  nextAction: Type.Optional(Type.Any({}))
}

// Code Action

export const CodeActionSettings = Type.Object({
  artifactSourceId: Type.Optional(Type.String({})),
  artifactPackagedId: Type.Optional(Type.String({})),
  artifact: Type.Optional(Type.String({})),
  input: Type.Object({}),
});


export type CodeActionSettings = Static<typeof CodeActionSettings>;

export const CodeAction = Type.Object({
  ...commonActionProps,
  type: Type.Literal(ActionType.CODE),
  settings: CodeActionSettings
});


export type CodeAction = Static<typeof CodeAction>;


// Piece Action
export const PieceActionSettings = Type.Object({
  pieceName: Type.String({}),
  actionName: Type.Optional(Type.String({})),
  input: Type.Object({}),
  inputUiInfo: Type.Record(Type.String({}), Type.Any())
});

export type PieceActionSettings = Static<typeof PieceActionSettings>;

export const PieceAction = Type.Object({
  ...commonActionProps,
  type: Type.Literal(ActionType.PIECE),
  settings: PieceActionSettings,
});

export type PieceAction = Static<typeof PieceAction>;

// Storage Action

export enum StoreOperation {
  PUT = 'PUT',
  GET = 'GET',
}

// Loop Items
export type LoopOnItemsActionSettings = {
  items: unknown;
};

export const LoopOnItemsAction = Type.Object({
  ...commonActionProps,
  type: Type.Literal(ActionType.LOOP_ON_ITEMS),
  settings: Type.Object({
    items: Type.Array(Type.Any({})),
  }),
  firstLoopAction: Type.Optional(Type.Any({})),
}


export type LoopOnItemsAction = Static<typeof LoopOnItemsAction> & {firstLoopAction?: Action};


// Union of all actions

export const Action = Type.Union([
  CodeAction,
  PieceAction,
  LoopOnItemsAction
 ]);

export type Action = Static<typeof Action> & {nextAction?: Action};