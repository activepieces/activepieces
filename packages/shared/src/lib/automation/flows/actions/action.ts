import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../../../core/common/base-model'
import { VersionType } from '../../pieces'
import { PropertySettings } from '../properties'
import { SampleDataSetting } from '../sample-data'

export enum FlowActionType {
    CODE = 'CODE',
    PIECE = 'PIECE',
    LOOP_ON_ITEMS = 'LOOP_ON_ITEMS',
    ROUTER = 'ROUTER',
}

export enum RouterExecutionType {
    EXECUTE_ALL_MATCH = 'EXECUTE_ALL_MATCH',
    EXECUTE_FIRST_MATCH = 'EXECUTE_FIRST_MATCH',
}

export enum BranchExecutionType {
    FALLBACK = 'FALLBACK',
    CONDITION = 'CONDITION',
}

const commonActionProps = {
    name: Type.String({}),
    valid: Type.Boolean({}),
    displayName: Type.String({}),
    skip: Type.Optional(Type.Boolean({})),
}
const commonActionSettings = {
    sampleData: Type.Optional(SampleDataSetting),
    customLogoUrl: Type.Optional(Type.String()),
}

export const ActionErrorHandlingOptions = Type.Optional(
    Type.Object({
        continueOnFailure: Type.Optional(
            Type.Object({
                value: Type.Optional(Type.Boolean()),
            }),
        ),
        retryOnFailure: Type.Optional(
            Type.Object({
                value: Type.Optional(Type.Boolean()),
            }),
        ),
    }),
)
export type ActionErrorHandlingOptions = Static<
  typeof ActionErrorHandlingOptions
>

export const SourceCode = Type.Object({
    packageJson: Type.String({}),
    code: Type.String({}),
})

export type SourceCode = Static<typeof SourceCode>

export const CodeActionSettings = Type.Object({
    ...commonActionSettings,
    sourceCode: SourceCode,
    input: Type.Record(Type.String({}), Type.Any()),
    errorHandlingOptions: ActionErrorHandlingOptions,
})

export type CodeActionSettings = Static<typeof CodeActionSettings>

export const CodeActionSchema = Type.Object({
    ...commonActionProps,
    type: Type.Literal(FlowActionType.CODE),
    settings: CodeActionSettings,
})
export const PieceActionSettings = Type.Object({
    ...commonActionSettings,
    propertySettings: Type.Record(Type.String(), PropertySettings),
    pieceName: Type.String({}),
    pieceVersion: VersionType,
    actionName: Type.Optional(Type.String({})),
    input: Type.Record(Type.String({}), Type.Unknown()),
    errorHandlingOptions: ActionErrorHandlingOptions,
})
export type PieceActionSettings = Static<typeof PieceActionSettings>

export const PieceActionSchema = Type.Object({
    ...commonActionProps,
    type: Type.Literal(FlowActionType.PIECE),
    settings: PieceActionSettings,
})

// Loop Items
export const LoopOnItemsActionSettings = Type.Object({
    ...commonActionSettings,
    items: Type.String(),
})
export type LoopOnItemsActionSettings = Static<
  typeof LoopOnItemsActionSettings
>

export const LoopOnItemsActionSchema = Type.Object({
    ...commonActionProps,
    type: Type.Literal(FlowActionType.LOOP_ON_ITEMS),
    settings: LoopOnItemsActionSettings,
    children: Type.Optional(Type.Array(Type.String())),
})

export enum BranchOperator {
    TEXT_CONTAINS = 'TEXT_CONTAINS',
    TEXT_DOES_NOT_CONTAIN = 'TEXT_DOES_NOT_CONTAIN',
    TEXT_EXACTLY_MATCHES = 'TEXT_EXACTLY_MATCHES',
    TEXT_DOES_NOT_EXACTLY_MATCH = 'TEXT_DOES_NOT_EXACTLY_MATCH',
    TEXT_STARTS_WITH = 'TEXT_START_WITH',
    TEXT_DOES_NOT_START_WITH = 'TEXT_DOES_NOT_START_WITH',
    TEXT_ENDS_WITH = 'TEXT_ENDS_WITH',
    TEXT_DOES_NOT_END_WITH = 'TEXT_DOES_NOT_END_WITH',
    NUMBER_IS_GREATER_THAN = 'NUMBER_IS_GREATER_THAN',
    NUMBER_IS_LESS_THAN = 'NUMBER_IS_LESS_THAN',
    NUMBER_IS_EQUAL_TO = 'NUMBER_IS_EQUAL_TO',
    BOOLEAN_IS_TRUE = 'BOOLEAN_IS_TRUE',
    BOOLEAN_IS_FALSE = 'BOOLEAN_IS_FALSE',
    DATE_IS_BEFORE = 'DATE_IS_BEFORE',
    DATE_IS_EQUAL = 'DATE_IS_EQUAL',
    DATE_IS_AFTER = 'DATE_IS_AFTER',
    LIST_CONTAINS = 'LIST_CONTAINS',
    LIST_DOES_NOT_CONTAIN = 'LIST_DOES_NOT_CONTAIN',
    LIST_IS_EMPTY = 'LIST_IS_EMPTY',
    LIST_IS_NOT_EMPTY = 'LIST_IS_NOT_EMPTY',
    EXISTS = 'EXISTS',
    DOES_NOT_EXIST = 'DOES_NOT_EXIST',
}

export const singleValueConditions = [
    BranchOperator.EXISTS,
    BranchOperator.DOES_NOT_EXIST,
    BranchOperator.BOOLEAN_IS_TRUE,
    BranchOperator.BOOLEAN_IS_FALSE,
    BranchOperator.LIST_IS_EMPTY,
    BranchOperator.LIST_IS_NOT_EMPTY,
]

export const textConditions = [
    BranchOperator.TEXT_CONTAINS,
    BranchOperator.TEXT_DOES_NOT_CONTAIN,
    BranchOperator.TEXT_EXACTLY_MATCHES,
    BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH,
    BranchOperator.TEXT_STARTS_WITH,
    BranchOperator.TEXT_DOES_NOT_START_WITH,
    BranchOperator.TEXT_ENDS_WITH,
    BranchOperator.TEXT_DOES_NOT_END_WITH,
    BranchOperator.LIST_CONTAINS,
    BranchOperator.LIST_DOES_NOT_CONTAIN,
]

const BranchOperatorTextLiterals = [
    Type.Literal(BranchOperator.TEXT_CONTAINS),
    Type.Literal(BranchOperator.TEXT_DOES_NOT_CONTAIN),
    Type.Literal(BranchOperator.TEXT_EXACTLY_MATCHES),
    Type.Literal(BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH),
    Type.Literal(BranchOperator.TEXT_STARTS_WITH),
    Type.Literal(BranchOperator.TEXT_DOES_NOT_START_WITH),
    Type.Literal(BranchOperator.TEXT_ENDS_WITH),
    Type.Literal(BranchOperator.TEXT_DOES_NOT_END_WITH),
    Type.Literal(BranchOperator.LIST_CONTAINS),
    Type.Literal(BranchOperator.LIST_DOES_NOT_CONTAIN),
]

const BranchOperatorNumberLiterals = [
    Type.Literal(BranchOperator.NUMBER_IS_GREATER_THAN),
    Type.Literal(BranchOperator.NUMBER_IS_LESS_THAN),
    Type.Literal(BranchOperator.NUMBER_IS_EQUAL_TO),
]

const BranchOperatorDateLiterals = [
    Type.Literal(BranchOperator.DATE_IS_BEFORE),
    Type.Literal(BranchOperator.DATE_IS_EQUAL),
    Type.Literal(BranchOperator.DATE_IS_AFTER),
]

const BranchOperatorSingleValueLiterals = [
    Type.Literal(BranchOperator.EXISTS),
    Type.Literal(BranchOperator.DOES_NOT_EXIST),
    Type.Literal(BranchOperator.BOOLEAN_IS_TRUE),
    Type.Literal(BranchOperator.BOOLEAN_IS_FALSE),
    Type.Literal(BranchOperator.LIST_IS_EMPTY),
    Type.Literal(BranchOperator.LIST_IS_NOT_EMPTY),
]

const BranchTextConditionValid = (addMinLength: boolean) =>
    Type.Object({
        firstValue: Type.String(addMinLength ? { minLength: 1 } : {}),
        secondValue: Type.String(addMinLength ? { minLength: 1 } : {}),
        caseSensitive: Type.Optional(Type.Boolean()),
        operator: Type.Optional(Type.Union(BranchOperatorTextLiterals)),
    })

const BranchNumberConditionValid = (addMinLength: boolean) =>
    Type.Object({
        firstValue: Type.String(addMinLength ? { minLength: 1 } : {}),
        secondValue: Type.String(addMinLength ? { minLength: 1 } : {}),
        operator: Type.Optional(Type.Union(BranchOperatorNumberLiterals)),
    })

const BranchDateConditionValid = (addMinLength: boolean) =>
    Type.Object({
        firstValue: Type.String(addMinLength ? { minLength: 1 } : {}),
        secondValue: Type.String(addMinLength ? { minLength: 1 } : {}),
        operator: Type.Optional(Type.Union(BranchOperatorDateLiterals)),
    })

const BranchSingleValueConditionValid = (addMinLength: boolean) =>
    Type.Object({
        firstValue: Type.String(addMinLength ? { minLength: 1 } : {}),
        operator: Type.Optional(Type.Union(BranchOperatorSingleValueLiterals)),
    })

const BranchConditionValid = (addMinLength: boolean) =>
    Type.Object({
        firstValue: Type.String(addMinLength ? { minLength: 1 } : {}),
        secondValue: Type.Optional(Type.String(addMinLength ? { minLength: 1 } : {})),
        caseSensitive: Type.Optional(Type.Boolean()),
        operator: Type.Optional(Type.Union([
            ...BranchOperatorTextLiterals,
            ...BranchOperatorNumberLiterals,
            ...BranchOperatorDateLiterals,
            ...BranchOperatorSingleValueLiterals,
        ])),
    })

export const ValidBranchCondition = BranchConditionValid(true)
export type ValidBranchCondition = Static<typeof ValidBranchCondition>

// TODO remove this and use ValidBranchCondition everywhere
export const BranchCondition = BranchConditionValid(false)
export type BranchCondition = Static<typeof BranchCondition>

export const BranchTextCondition = BranchTextConditionValid(false)
export type BranchTextCondition = Static<typeof BranchTextCondition>

export const BranchNumberCondition = BranchNumberConditionValid(false)
export type BranchNumberCondition = Static<typeof BranchNumberCondition>

export const BranchDateCondition = BranchDateConditionValid(false)
export type BranchDateCondition = Static<typeof BranchDateCondition>

export const BranchSingleValueCondition =
  BranchSingleValueConditionValid(false)
export type BranchSingleValueCondition = Static<
  typeof BranchSingleValueCondition
>

export const FlowBranchSchema = DiscriminatedUnion('branchType', [
    Type.Object({
        conditions: Type.Array(Type.Array(BranchConditionValid(false))),
        branchType: Type.Literal(BranchExecutionType.CONDITION),
        branchName: Type.String(),
        steps: Type.Array(Type.String()),
    }),
    Type.Object({
        branchType: Type.Literal(BranchExecutionType.FALLBACK),
        branchName: Type.String(),
        steps: Type.Array(Type.String()),
    }),
])

export const RouterActionSettings = Type.Object({
    ...commonActionSettings,
    executionType: Type.Enum(RouterExecutionType),
})

export const RouterActionSettingsWithValidation = Type.Object({
    executionType: Type.Enum(RouterExecutionType),
})

export type RouterActionSettings = Static<typeof RouterActionSettings>

export const RouterActionSchema = Type.Object({
    ...commonActionProps,
    type: Type.Literal(FlowActionType.ROUTER),
    settings: RouterActionSettings,
    branches: Type.Optional(Type.Array(FlowBranchSchema)),
})

export const SingleActionSchema = Type.Union([
    CodeActionSchema,
    PieceActionSchema,
    LoopOnItemsActionSchema,
    RouterActionSchema,
])

export type FlowAction = Static<typeof SingleActionSchema>

export type FlowBranch = Static<typeof FlowBranchSchema>

export type LoopOnItemsAction = Static<typeof LoopOnItemsActionSchema>

export type RouterAction = Static<typeof RouterActionSchema>

export type PieceAction = Static<typeof PieceActionSchema>

export type CodeAction = Static<typeof CodeActionSchema>

export const emptyCondition: ValidBranchCondition = {
    firstValue: '',
    secondValue: '',
    operator: BranchOperator.TEXT_CONTAINS,
    caseSensitive: false,
}
