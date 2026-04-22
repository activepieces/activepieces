import { z } from 'zod'
import { STEP_NAME_REGEX } from '../../../core/common'
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
    name: z.string().regex(STEP_NAME_REGEX),
    valid: z.boolean(),
    displayName: z.string(),
    skip: z.boolean().optional(),
    lastUpdatedDate: z.string(),
}
const commonActionSettings = {
    sampleData: SampleDataSetting.optional(),
    customLogoUrl: z.string().optional(),
}

export const ActionErrorHandlingOptions = z.object({
    continueOnFailure: z.object({
        value: z.boolean().optional(),
    }).optional(),
    retryOnFailure: z.object({
        value: z.boolean().optional(),
    }).optional(),
}).optional()

export type ActionErrorHandlingOptions = z.infer<
  typeof ActionErrorHandlingOptions
>

export const SourceCode = z.object({
    packageJson: z.string(),
    code: z.string(),
})

export type SourceCode = z.infer<typeof SourceCode>

export const CodeActionSettings = z.object({
    ...commonActionSettings,
    sourceCode: SourceCode,
    input: z.record(z.string(), z.any()),
    errorHandlingOptions: ActionErrorHandlingOptions,
})

export type CodeActionSettings = z.infer<typeof CodeActionSettings>

export const CodeActionSchema = z.object({
    ...commonActionProps,
    type: z.literal(FlowActionType.CODE),
    settings: CodeActionSettings,
})
export const PieceActionSettings = z.object({
    ...commonActionSettings,
    propertySettings: z.record(z.string(), PropertySettings),
    pieceName: z.string(),
    pieceVersion: VersionType,
    actionName: z.string().optional(),
    input: z.record(z.string(), z.unknown()),
    errorHandlingOptions: ActionErrorHandlingOptions,
})
export type PieceActionSettings = z.infer<typeof PieceActionSettings>

export const PieceActionSchema = z.object({
    ...commonActionProps,
    type: z.literal(FlowActionType.PIECE),
    settings: PieceActionSettings,
})

// Loop Items
export const LoopOnItemsActionSettings = z.object({
    ...commonActionSettings,
    items: z.string(),
})
export type LoopOnItemsActionSettings = z.infer<
  typeof LoopOnItemsActionSettings
>

export const LoopOnItemsActionSchema = z.object({
    ...commonActionProps,
    type: z.literal(FlowActionType.LOOP_ON_ITEMS),
    settings: LoopOnItemsActionSettings,
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
    z.literal(BranchOperator.TEXT_CONTAINS),
    z.literal(BranchOperator.TEXT_DOES_NOT_CONTAIN),
    z.literal(BranchOperator.TEXT_EXACTLY_MATCHES),
    z.literal(BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH),
    z.literal(BranchOperator.TEXT_STARTS_WITH),
    z.literal(BranchOperator.TEXT_DOES_NOT_START_WITH),
    z.literal(BranchOperator.TEXT_ENDS_WITH),
    z.literal(BranchOperator.TEXT_DOES_NOT_END_WITH),
    z.literal(BranchOperator.LIST_CONTAINS),
    z.literal(BranchOperator.LIST_DOES_NOT_CONTAIN),
] as const

const BranchOperatorNumberLiterals = [
    z.literal(BranchOperator.NUMBER_IS_GREATER_THAN),
    z.literal(BranchOperator.NUMBER_IS_LESS_THAN),
    z.literal(BranchOperator.NUMBER_IS_EQUAL_TO),
] as const

const BranchOperatorDateLiterals = [
    z.literal(BranchOperator.DATE_IS_BEFORE),
    z.literal(BranchOperator.DATE_IS_EQUAL),
    z.literal(BranchOperator.DATE_IS_AFTER),
] as const

const BranchOperatorSingleValueLiterals = [
    z.literal(BranchOperator.EXISTS),
    z.literal(BranchOperator.DOES_NOT_EXIST),
    z.literal(BranchOperator.BOOLEAN_IS_TRUE),
    z.literal(BranchOperator.BOOLEAN_IS_FALSE),
    z.literal(BranchOperator.LIST_IS_EMPTY),
    z.literal(BranchOperator.LIST_IS_NOT_EMPTY),
] as const

function buildBranchTextConditionValid(addMinLength: boolean) {
    return z.object({
        firstValue: addMinLength ? z.string().min(1) : z.string(),
        secondValue: addMinLength ? z.string().min(1) : z.string(),
        caseSensitive: z.boolean().optional(),
        operator: z.union(BranchOperatorTextLiterals).optional(),
    })
}

function buildBranchNumberConditionValid(addMinLength: boolean) {
    return z.object({
        firstValue: addMinLength ? z.string().min(1) : z.string(),
        secondValue: addMinLength ? z.string().min(1) : z.string(),
        operator: z.union(BranchOperatorNumberLiterals).optional(),
    })
}

function buildBranchDateConditionValid(addMinLength: boolean) {
    return z.object({
        firstValue: addMinLength ? z.string().min(1) : z.string(),
        secondValue: addMinLength ? z.string().min(1) : z.string(),
        operator: z.union(BranchOperatorDateLiterals).optional(),
    })
}

function buildBranchSingleValueConditionValid(addMinLength: boolean) {
    return z.object({
        firstValue: addMinLength ? z.string().min(1) : z.string(),
        operator: z.union(BranchOperatorSingleValueLiterals).optional(),
    })
}

function buildBranchConditionValid(addMinLength: boolean) {
    return z.union([
        buildBranchTextConditionValid(addMinLength),
        buildBranchNumberConditionValid(addMinLength),
        buildBranchDateConditionValid(addMinLength),
        buildBranchSingleValueConditionValid(addMinLength),
    ])
}

export const ValidBranchCondition = buildBranchConditionValid(true)
export type ValidBranchCondition = z.infer<typeof ValidBranchCondition>

// TODO remove this and use ValidBranchCondition everywhere
export const BranchCondition = buildBranchConditionValid(false)
export type BranchCondition = z.infer<typeof BranchCondition>

export const BranchTextCondition = buildBranchTextConditionValid(false)
export type BranchTextCondition = z.infer<typeof BranchTextCondition>

export const BranchNumberCondition = buildBranchNumberConditionValid(false)
export type BranchNumberCondition = z.infer<typeof BranchNumberCondition>

export const BranchDateCondition = buildBranchDateConditionValid(false)
export type BranchDateCondition = z.infer<typeof BranchDateCondition>

export const BranchSingleValueCondition =
  buildBranchSingleValueConditionValid(false)
export type BranchSingleValueCondition = z.infer<
  typeof BranchSingleValueCondition
>


export const RouterBranchesSchema = (addMinLength: boolean) =>
    z.array(
        z.union([
            z.object({
                conditions: z.array(z.array(buildBranchConditionValid(addMinLength))),
                branchType: z.literal(BranchExecutionType.CONDITION),
                branchName: z.string(),
            }),
            z.object({
                branchType: z.literal(BranchExecutionType.FALLBACK),
                branchName: z.string(),
            }),
        ]),
    )

export const RouterActionSettings = z.object({
    ...commonActionSettings,
    branches: RouterBranchesSchema(false),
    executionType: z.nativeEnum(RouterExecutionType),
})

export const RouterActionSettingsWithValidation = z.object({
    branches: RouterBranchesSchema(true),
    executionType: z.nativeEnum(RouterExecutionType),
})

export type RouterActionSettings = z.infer<typeof RouterActionSettings>



// Union of all actions

export const FlowAction: z.ZodType<FlowAction> = z.lazy(() =>
    z.union([
        CodeActionSchema.extend({
            nextAction: FlowAction.optional(),
        }),
        PieceActionSchema.extend({
            nextAction: FlowAction.optional(),
        }),
        LoopOnItemsActionSchema.extend({
            nextAction: FlowAction.optional(),
            firstLoopAction: FlowAction.optional(),
        }),
        z.object({
            ...commonActionProps,
            type: z.literal(FlowActionType.ROUTER),
            settings: RouterActionSettings,
            nextAction: FlowAction.optional(),
            children: z.array(z.union([FlowAction, z.null()])),
        }),
    ]),
)
export const RouterActionSchema = z.object({
    ...commonActionProps,
    type: z.literal(FlowActionType.ROUTER),
    settings: RouterActionSettings,
})

export const SingleActionSchema = z.union([
    CodeActionSchema,
    PieceActionSchema,
    LoopOnItemsActionSchema,
    RouterActionSchema,
])

// Manually defined to avoid z.infer in recursive types (causes TypeScript OOM)
type BaseActionProps = {
    name: string
    valid: boolean
    displayName: string
    skip?: boolean
    lastUpdatedDate: string
}

export type FlowAction =
    | (BaseActionProps & { type: FlowActionType.CODE, settings: CodeActionSettings, nextAction?: FlowAction })
    | (BaseActionProps & { type: FlowActionType.PIECE, settings: PieceActionSettings, nextAction?: FlowAction })
    | (BaseActionProps & { type: FlowActionType.LOOP_ON_ITEMS, settings: LoopOnItemsActionSettings, nextAction?: FlowAction, firstLoopAction?: FlowAction })
    | (BaseActionProps & { type: FlowActionType.ROUTER, settings: RouterActionSettings, nextAction?: FlowAction, children: (FlowAction | null)[] })

export type RouterAction = BaseActionProps & {
    type: FlowActionType.ROUTER
    settings: RouterActionSettings
    nextAction?: FlowAction
    children: (FlowAction | null)[]
}

export type LoopOnItemsAction = BaseActionProps & {
    type: FlowActionType.LOOP_ON_ITEMS
    settings: LoopOnItemsActionSettings
    nextAction?: FlowAction
    firstLoopAction?: FlowAction
}

export type PieceAction = BaseActionProps & {
    type: FlowActionType.PIECE
    settings: PieceActionSettings
    nextAction?: FlowAction
}

export type CodeAction = BaseActionProps & {
    type: FlowActionType.CODE
    settings: CodeActionSettings
    nextAction?: FlowAction
}


export const emptyCondition: ValidBranchCondition = {
    firstValue: '',
    secondValue: '',
    operator: BranchOperator.TEXT_CONTAINS,
    caseSensitive: false,
}
