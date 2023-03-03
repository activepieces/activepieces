import { Type, Static } from '@sinclair/typebox';
import { SemVerType } from '../../pieces';

export enum ActionType {
  CODE = 'CODE',
  PIECE = 'PIECE',
  LOOP_ON_ITEMS = 'LOOP_ON_ITEMS',
  BRANCH = 'BRANCH',
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
  input: Type.Record(Type.String({}), Type.Any()),
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
  pieceVersion: SemVerType,
  actionName: Type.Optional(Type.String({})),
  input: Type.Record(Type.String({}), Type.Any()),
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
});


export type LoopOnItemsAction = Static<typeof LoopOnItemsAction> & { firstLoopAction?: Action };

// Loop Items

export enum BranchOperator {
  TEXT_CONTAINS = 'TEXT_CONTAINS',
  TEXT_DOES_NOT_CONTAIN = 'TEXT_DOES_NOT_CONTAIN',
  TEXT_EXACTLY_MATCHES = 'TEXT_EXACTLY_MATCHES',
  TEXT_DOES_NOT_EXACTLY_MATCHES = 'TEXT_DOES_NOT_EXACTLY_MATCHES',
  TEXT_START_WITH = 'TEXT_START_WITH',
  TEXT_DOES_NOT_START_WITH = 'TEXT_DOES_NOT_START_WITH',
  TEXT_END_WITH = 'TEXT_END_WITH',
  TEXT_DOES_NOT_END_WITH = 'TEXT_DOES_NOT_END_WITH',
  NUMBER_IS_GREATER_THAN = 'NUMBER_IS_GREATER_THAN',
  NUMBER_IS_LESS_THAN = 'NUMBER_IS_LESS_THAN',
  BOOLEAN_IS_TRUE = 'BOOLEAN_IS_TRUE',
  BOOLEAN_IS_FALSE = 'BOOLEAN_IS_FALSE',
  EXISTS = 'EXISTS',
  DOES_NOT_EXIST = 'DOES_NOT_EXIST',
}

export const singleValueConditions = [
  BranchOperator.EXISTS,
  BranchOperator.DOES_NOT_EXIST,
  BranchOperator.BOOLEAN_IS_TRUE,
  BranchOperator.BOOLEAN_IS_FALSE
]
export const BranchCondition = Type.Union([
  Type.Object({
    firstValue: Type.String({}),
    secondValue: Type.String({}),
    operator: Type.Optional(Type.Union([...Object.values(BranchOperator).
      filter(c => singleValueConditions.find(sc => sc === c) === undefined).map(c=>{
      return Type.Literal(c)
    }) ]))
  }),
  Type.Object({
    firstValue: Type.String({}),
    operator:  Type.Union([...Object.values(BranchOperator).
      filter(c => singleValueConditions.find(sc => sc === c) !== undefined).map(c=>{
      return Type.Literal(c)
    }) ])
  })
]);

export type BranchCondition = Static<typeof BranchCondition>;

export type BranchActionSettings = {
  conditions: BranchCondition[][];
};

export const BranchAction = Type.Object({
  ...commonActionProps,
  type: Type.Literal(ActionType.BRANCH),
  settings: Type.Object({
    conditions: Type.Array(Type.Array(BranchCondition)),
  }),
  onSuccessAction: Type.Optional(Type.Any({})),
  onFailureAction: Type.Optional(Type.Any({})),
});

export type BranchAction = Static<typeof BranchAction> & { onSuccessAction?: Action, onFailureAction?: Action };


// Union of all actions

export const Action = Type.Union([
  CodeAction,
  PieceAction,
  LoopOnItemsAction,
  BranchAction
]);

export type Action = Static<typeof Action> & { nextAction?: Action };
