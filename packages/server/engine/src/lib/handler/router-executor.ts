import { isNil, spreadIfDefined, tryCatchSync } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { BranchCondition, BranchExecutionType, BranchOperator, EngineGenericError, FlowRunStatus, RouterAction, RouterActionSettings, RouterExecutionType, RouterStepOutput, StepOutputStatus } from '@activepieces/shared'
import dayjs, { Dayjs } from 'dayjs'
import { aiConditionApi } from '../api/ai-condition-api'
import { utils } from '../utils'
import { BaseExecutor, failStep } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'

export const routerExecuter: BaseExecutor<RouterAction> = {
    async handle({
        action,
        executionState,
        constants,
    }) {
        const stepStartTime = performance.now()
        const { data: resolved, error: resolveError } = await utils.tryCatchAndThrowOnEngineError(() =>
            constants.getPropsResolver({ contextVersion: LATEST_CONTEXT_VERSION }).resolve<RouterActionSettings>({
                unresolvedInput: {
                    ...action.settings,
                },
                executionState,
            }),
        )
        if (resolveError) {
            return failStep({
                action,
                executionState,
                stepOutput: RouterStepOutput.init({ input: {} }),
                error: resolveError,
                durationMs: performance.now() - stepStartTime,
            })
        }
        const { censoredInput, resolvedInput } = resolved

        switch (resolvedInput.executionType) {
            case RouterExecutionType.EXECUTE_ALL_MATCH:
            case RouterExecutionType.EXECUTE_FIRST_MATCH:
                return handleRouterExecution({ action, executionState, constants, censoredInput, resolvedInput, routerExecutionType: resolvedInput.executionType })
            default:
                throw new EngineGenericError('RouterExecutionTypeNotSupportedError', `Router execution type ${resolvedInput.executionType} is not supported`)
        }
    },
}

export async function evaluateConditions({ conditionGroups, constants }: EvaluateConditionsParams): Promise<boolean> {
    for (const conditionGroup of conditionGroups) {
        if (await evaluateConditionGroup({ conditionGroup, constants })) {
            return true
        }
    }
    return false
}

async function evaluateConditionGroup({ conditionGroup, constants }: EvaluateConditionGroupParams): Promise<boolean> {
    for (const condition of conditionGroup) {
        const matched = await evaluateCondition({ condition, constants })
        if (!matched) {
            return false
        }
    }
    return true
}

async function evaluateCondition({ condition, constants }: EvaluateConditionParams): Promise<boolean> {
    if (isNil(condition.operator)) {
        throw new EngineGenericError('OperatorNotSetError', 'The operator is required but found to be undefined')
    }
    if (condition.operator === BranchOperator.AI_MATCHES) {
        return aiConditionApi.matches({
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            text: condition.firstValue,
            question: condition.secondValue,
            ...spreadIfDefined('threshold', condition.threshold),
        })
    }
    const evaluate: ConditionEvaluator | undefined = CONDITION_EVALUATORS[condition.operator]
    if (isNil(evaluate)) {
        throw new EngineGenericError('UnknownOperatorError', `The operator ${condition.operator} is not supported by this engine version`)
    }
    return evaluate(toConditionValues(condition))
}

const CONDITION_EVALUATORS: Record<SynchronousBranchOperator, ConditionEvaluator> = {
    [BranchOperator.TEXT_CONTAINS]: (c) => text(c.firstValue, c).includes(text(c.secondValue, c)),
    [BranchOperator.TEXT_DOES_NOT_CONTAIN]: (c) => !text(c.firstValue, c).includes(text(c.secondValue, c)),
    [BranchOperator.TEXT_EXACTLY_MATCHES]: (c) => text(c.firstValue, c) === text(c.secondValue, c),
    [BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH]: (c) => text(c.firstValue, c) !== text(c.secondValue, c),
    [BranchOperator.TEXT_STARTS_WITH]: (c) => text(c.firstValue, c).startsWith(text(c.secondValue, c)),
    [BranchOperator.TEXT_DOES_NOT_START_WITH]: (c) => !text(c.firstValue, c).startsWith(text(c.secondValue, c)),
    [BranchOperator.TEXT_ENDS_WITH]: (c) => text(c.firstValue, c).endsWith(text(c.secondValue, c)),
    [BranchOperator.TEXT_DOES_NOT_END_WITH]: (c) => !text(c.firstValue, c).endsWith(text(c.secondValue, c)),
    [BranchOperator.LIST_CONTAINS]: (c) => coerceListAsArray(c.firstValue).some((item) => text(item, c) === text(c.secondValue, c)),
    [BranchOperator.LIST_DOES_NOT_CONTAIN]: (c) => !coerceListAsArray(c.firstValue).some((item) => text(item, c) === text(c.secondValue, c)),
    [BranchOperator.NUMBER_IS_GREATER_THAN]: (c) => parseStringToNumber(c.firstValue) > parseStringToNumber(c.secondValue),
    [BranchOperator.NUMBER_IS_LESS_THAN]: (c) => parseStringToNumber(c.firstValue) < parseStringToNumber(c.secondValue),
    // eslint-disable-next-line eqeqeq
    [BranchOperator.NUMBER_IS_EQUAL_TO]: (c) => parseStringToNumber(c.firstValue) == parseStringToNumber(c.secondValue),
    [BranchOperator.BOOLEAN_IS_TRUE]: (c) => !!c.firstValue,
    [BranchOperator.BOOLEAN_IS_FALSE]: (c) => !c.firstValue,
    [BranchOperator.DATE_IS_AFTER]: (c) => compareDates(c, (first, second) => first.isAfter(second)),
    [BranchOperator.DATE_IS_EQUAL]: (c) => compareDates(c, (first, second) => first.isSame(second)),
    [BranchOperator.DATE_IS_BEFORE]: (c) => compareDates(c, (first, second) => first.isBefore(second)),
    [BranchOperator.LIST_IS_EMPTY]: (c) => parseListAsArray(c.firstValue)?.length === 0,
    [BranchOperator.LIST_IS_NOT_EMPTY]: (c) => (parseListAsArray(c.firstValue)?.length ?? 0) !== 0,
    [BranchOperator.EXISTS]: (c) => !isNil(c.firstValue) && c.firstValue !== '',
    [BranchOperator.DOES_NOT_EXIST]: (c) => isNil(c.firstValue) || c.firstValue === '',
}

async function handleRouterExecution({ action, executionState, constants, censoredInput, resolvedInput, routerExecutionType }: {
    action: RouterAction
    executionState: FlowExecutorContext
    constants: EngineConstants
    censoredInput: unknown
    resolvedInput: RouterActionSettings
    routerExecutionType: RouterExecutionType
}): Promise<FlowExecutorContext> {
    const stepStartTime = performance.now()

    const { data: evaluatedConditionsWithoutFallback, error: conditionError } = await utils.tryCatchAndThrowOnEngineError(
        () => evaluateBranches({ branches: resolvedInput.branches, constants }),
    )
    if (conditionError) {
        return failStep({
            action,
            executionState,
            stepOutput: RouterStepOutput.init({ input: censoredInput }),
            error: conditionError,
            durationMs: performance.now() - stepStartTime,
        })
    }

    const evaluatedConditions = resolvedInput.branches.map((branch, index) => {
        if (branch.branchType === BranchExecutionType.CONDITION) {
            return evaluatedConditionsWithoutFallback[index]
        }
        const fallback = evaluatedConditionsWithoutFallback.filter((_, i) => i !== index).every((condition) => !condition)
        return fallback
    })

    const routerOutput = RouterStepOutput.init({
        input: censoredInput,
    }).setOutput({
        branches: resolvedInput.branches.map((branch, index) => ({
            branchName: branch.branchName,
            branchIndex: index + 1,
            evaluation: evaluatedConditions[index],
        })),
    }).setDuration(performance.now() - stepStartTime)
    executionState = await executionState.upsertStep(action.name, routerOutput)

    const { data: executionStateResult, error: executionStateError } = await utils.tryCatchAndThrowOnEngineError(async () => {
        for (let i = 0; i < resolvedInput.branches.length; i++) {
            if (!isNil(constants.stepNameToTest)) {
                break
            }
            const condition = routerOutput.output?.branches[i].evaluation
            if (!condition) {
                continue
            }

            executionState = await flowExecutor.execute({
                action: action.children[i],
                executionState,
                constants,
            })

            const shouldBreakExecution = executionState.verdict.status !== FlowRunStatus.RUNNING || routerExecutionType === RouterExecutionType.EXECUTE_FIRST_MATCH
            if (shouldBreakExecution) {
                break
            }
        }
        return executionState
    })
    if (executionStateError) {
        return failStep({
            action,
            executionState,
            stepOutput: routerOutput.setStatus(StepOutputStatus.FAILED),
            error: executionStateError,
        })
    }

    return executionStateResult
}

async function evaluateBranches({ branches, constants }: EvaluateBranchesParams): Promise<boolean[]> {
    const evaluations: boolean[] = []
    for (const branch of branches) {
        const evaluation = branch.branchType === BranchExecutionType.FALLBACK
            ? true
            : await evaluateConditions({ conditionGroups: branch.conditions, constants })
        evaluations.push(evaluation)
    }
    return evaluations
}

function toConditionValues(condition: BranchCondition): ConditionValues {
    return {
        firstValue: condition.firstValue,
        secondValue: 'secondValue' in condition ? condition.secondValue : undefined,
        caseSensitive: 'caseSensitive' in condition ? condition.caseSensitive : undefined,
    }
}

function text(value: unknown, { caseSensitive }: ConditionValues): string {
    const asString = typeof value === 'string' ? value : JSON.stringify(value)
    return caseSensitive ? asString : asString.toLowerCase()
}

function parseStringToNumber(str: string | undefined): number | string {
    const num = Number(str)
    return isNaN(num) ? String(str) : num
}

function parseListAsArray(input: unknown): unknown[] | undefined {
    if (typeof input === 'string') {
        const { data } = tryCatchSync(() => JSON.parse(input))
        return Array.isArray(data) ? data : undefined
    }
    return Array.isArray(input) ? input : undefined
}

function coerceListAsArray(input: unknown): unknown[] {
    if (typeof input === 'string') {
        const { data, error } = tryCatchSync(() => JSON.parse(input))
        if (error) {
            return [input]
        }
        return Array.isArray(data) ? data : [data]
    }
    return Array.isArray(input) ? input : [input]
}

function compareDates({ firstValue, secondValue }: ConditionValues, compare: (first: Dayjs, second: Dayjs) => boolean): boolean {
    if (!isDateLike(firstValue) || !isDateLike(secondValue)) {
        return false
    }
    const first = dayjs(firstValue)
    const second = dayjs(secondValue)
    return first.isValid() && second.isValid() && compare(first, second)
}

function isDateLike(value: unknown): value is string | number | Date {
    return typeof value === 'string' || typeof value === 'number' || value instanceof Date
}

type ConditionValues = {
    firstValue: string
    secondValue?: string
    caseSensitive?: boolean
}

type ConditionEvaluator = (condition: ConditionValues) => boolean

type SynchronousBranchOperator = Exclude<BranchOperator, BranchOperator.AI_MATCHES>

type AiConditionConstants = {
    internalApiUrl: string
    engineToken: string
}

type EvaluateConditionsParams = {
    conditionGroups: BranchCondition[][]
    constants: AiConditionConstants
}

type EvaluateConditionGroupParams = {
    conditionGroup: BranchCondition[]
    constants: AiConditionConstants
}

type EvaluateConditionParams = {
    condition: BranchCondition
    constants: AiConditionConstants
}

type EvaluateBranchesParams = {
    branches: RouterActionSettings['branches']
    constants: AiConditionConstants
}
