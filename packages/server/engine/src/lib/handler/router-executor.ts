import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { BranchCondition, BranchExecutionType, BranchOperator, EngineGenericError, FlowGraphNode, FlowRunStatus, flowStructureUtil, isNil, RouterAction, RouterExecutionType, RouterStepOutput, StepOutputStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { utils } from '../utils'
import { BaseExecutor } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'

export const routerExecuter: BaseExecutor = {
    async handle({
        node,
        executionState,
        constants,
    }) {
        const action = node.data as RouterAction
        const stepName = node.id
        const graph = constants.flowVersion!.graph
        const branchEdges = flowStructureUtil.getBranchEdges(graph, stepName)
        const branches = branchEdges.map(edge => ({
            branchType: edge.branchType,
            branchName: edge.branchName,
            conditions: edge.conditions,
        }))
        const { censoredInput, resolvedInput } = await constants.getPropsResolver(LATEST_CONTEXT_VERSION).resolve<RouterResolvedInput>({
            unresolvedInput: {
                ...action.settings,
                branches,
            },
            executionState,
        })

        switch (resolvedInput.executionType) {
            case RouterExecutionType.EXECUTE_ALL_MATCH:
                return handleRouterExecution({ node, executionState, constants, censoredInput, resolvedInput, routerExecutionType: RouterExecutionType.EXECUTE_ALL_MATCH })
            case RouterExecutionType.EXECUTE_FIRST_MATCH:
                return handleRouterExecution({ node, executionState, constants, censoredInput, resolvedInput, routerExecutionType: RouterExecutionType.EXECUTE_FIRST_MATCH })
            default:
                throw new EngineGenericError('RouterExecutionTypeNotSupportedError', `Router execution type ${resolvedInput.executionType} is not supported`)
        }
    },
}

async function handleRouterExecution({ node, executionState, constants, censoredInput, resolvedInput, routerExecutionType }: {
    node: FlowGraphNode
    executionState: FlowExecutorContext
    constants: EngineConstants
    censoredInput: unknown
    resolvedInput: RouterResolvedInput
    routerExecutionType: RouterExecutionType
}): Promise<FlowExecutorContext> {
    const action = node.data as RouterAction
    const stepName = node.id
    const stepStartTime = performance.now()

    const evaluatedConditionsWithoutFallback = resolvedInput.branches.map((branch) => {
        return branch.branchType === BranchExecutionType.FALLBACK ? true : evaluateConditions(branch.conditions)
    })

    const evaluatedConditions = resolvedInput.branches.map((branch, index) => {
        if (branch.branchType === BranchExecutionType.CONDITION) {
            return evaluatedConditionsWithoutFallback[index]
        }
        const fallback = evaluatedConditionsWithoutFallback.filter((_, i) => i !== index).every((condition) => !condition)
        return fallback
    })

    const stepEndTime = performance.now()
    const routerOutput = RouterStepOutput.init({
        input: censoredInput,
    }).setOutput({
        branches: resolvedInput.branches.map((branch, index) => ({
            branchName: branch.branchName,
            branchIndex: index + 1,
            evaluation: evaluatedConditions[index],
        })),
    }).setDuration(stepEndTime - stepStartTime)
    executionState = executionState.upsertStep(stepName, routerOutput)

    const { data: executionStateResult, error: executionStateError } = await utils.tryCatchAndThrowOnEngineError(async () => {
        for (let i = 0; i < resolvedInput.branches.length; i++) {
            if (!isNil(constants.stepNameToTest)) {
                break
            }
            const condition = routerOutput.output?.branches[i].evaluation
            if (!condition) {
                continue
            }

            const graph = constants.flowVersion!.graph
            const branchEdgesInner = flowStructureUtil.getBranchEdges(graph, stepName)
            const branchStepNames = branchEdgesInner[i]?.target
                ? flowStructureUtil.getDefaultChain(graph, branchEdgesInner[i].target!)
                : []
            executionState = await flowExecutor.execute({
                stepNames: branchStepNames,
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
        const failedStepOutput = routerOutput.setStatus(StepOutputStatus.FAILED)
        return executionState.upsertStep(stepName, failedStepOutput).setVerdict({ status: FlowRunStatus.FAILED, failedStep: {
            name: stepName,
            displayName: action.displayName,
            message: utils.formatError(executionStateError),
        } })
    }

    return executionStateResult
}


export function evaluateConditions(conditionGroups: BranchCondition[][]): boolean {
    let orOperator = false
    for (const conditionGroup of conditionGroups) {
        let andGroup = true
        for (const condition of conditionGroup) {
            const castedCondition = condition

            if (isNil(castedCondition.operator)) {
                throw new EngineGenericError('OperatorNotSetError', 'The operator is required but found to be undefined')
            }

            switch (castedCondition.operator) {
                case BranchOperator.TEXT_CONTAINS: {
                    const firstValueContains = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).includes(
                        toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive),
                    )
                    andGroup = andGroup && firstValueContains
                    break
                }
                case BranchOperator.TEXT_DOES_NOT_CONTAIN: {
                    const firstValueDoesNotContain = !toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).includes(
                        toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive),
                    )
                    andGroup = andGroup && firstValueDoesNotContain
                    break
                }
                case BranchOperator.TEXT_EXACTLY_MATCHES: {
                    const firstValueExactlyMatches = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive) ===
                        toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive)
                    andGroup = andGroup && firstValueExactlyMatches
                    break
                }
                case BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH: {
                    const firstValueDoesNotExactlyMatch = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive) !==
                        toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive)
                    andGroup = andGroup && firstValueDoesNotExactlyMatch
                    break
                }
                case BranchOperator.TEXT_STARTS_WITH: {
                    const firstValueStartsWith = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).startsWith(
                        toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive),
                    )
                    andGroup = andGroup && firstValueStartsWith
                    break
                }
                case BranchOperator.TEXT_ENDS_WITH: {
                    const firstValueEndsWith = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).endsWith(
                        toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive),
                    )
                    andGroup = andGroup && firstValueEndsWith
                    break
                }
                case BranchOperator.TEXT_DOES_NOT_START_WITH: {
                    const firstValueDoesNotStartWith = !toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).startsWith(
                        toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive),
                    )
                    andGroup = andGroup && firstValueDoesNotStartWith
                    break
                }
                case BranchOperator.TEXT_DOES_NOT_END_WITH: {
                    const firstValueDoesNotEndWith = !toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).endsWith(
                        toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive),
                    )
                    andGroup = andGroup && firstValueDoesNotEndWith
                    break
                }
                case BranchOperator.LIST_CONTAINS: {
                    const list = parseAndCoerceListAsArray(castedCondition.firstValue)
                    andGroup = andGroup && list.some((item) =>
                        toLowercaseIfCaseInsensitive(item, castedCondition.caseSensitive) === toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive),
                    )
                    break
                }
                case BranchOperator.LIST_DOES_NOT_CONTAIN: {
                    const list = parseAndCoerceListAsArray(castedCondition.firstValue)
                    andGroup = andGroup && !list.some((item) =>
                        toLowercaseIfCaseInsensitive(item, castedCondition.caseSensitive) === toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive),
                    )
                    break
                }
                case BranchOperator.NUMBER_IS_GREATER_THAN: {
                    const firstValue = parseStringToNumber(castedCondition.firstValue)
                    const secondValue = parseStringToNumber(castedCondition.secondValue)
                    andGroup = andGroup && firstValue > secondValue
                    break
                }
                case BranchOperator.NUMBER_IS_LESS_THAN: {
                    const firstValue = parseStringToNumber(castedCondition.firstValue)
                    const secondValue = parseStringToNumber(castedCondition.secondValue)
                    andGroup = andGroup && firstValue < secondValue
                    break
                }
                case BranchOperator.NUMBER_IS_EQUAL_TO: {
                    const firstValue = parseStringToNumber(castedCondition.firstValue)
                    const secondValue = parseStringToNumber(castedCondition.secondValue)
                    andGroup = andGroup && firstValue == secondValue
                    break
                }
                case BranchOperator.BOOLEAN_IS_TRUE:
                    andGroup = andGroup && !!castedCondition.firstValue
                    break
                case BranchOperator.BOOLEAN_IS_FALSE:
                    andGroup = andGroup && !castedCondition.firstValue
                    break
                case BranchOperator.DATE_IS_AFTER:
                    andGroup = andGroup && isValidDate(castedCondition.firstValue) && isValidDate(castedCondition.secondValue) && dayjs(castedCondition.firstValue).isAfter(dayjs(castedCondition.secondValue))
                    break
                case BranchOperator.DATE_IS_EQUAL:
                    andGroup = andGroup && isValidDate(castedCondition.firstValue) && isValidDate(castedCondition.secondValue) && dayjs(castedCondition.firstValue).isSame(dayjs(castedCondition.secondValue))
                    break
                case BranchOperator.DATE_IS_BEFORE:
                    andGroup = andGroup && isValidDate(castedCondition.firstValue) && isValidDate(castedCondition.secondValue) && dayjs(castedCondition.firstValue).isBefore(dayjs(castedCondition.secondValue))
                    break
                case BranchOperator.LIST_IS_EMPTY: {
                    const list = parseListAsArray(castedCondition.firstValue)
                    andGroup = andGroup && Array.isArray(list) && list?.length === 0
                    break
                }
                case BranchOperator.LIST_IS_NOT_EMPTY: {
                    const list = parseListAsArray(castedCondition.firstValue)
                    andGroup = andGroup && Array.isArray(list) && list?.length !== 0
                    break
                }
                case BranchOperator.EXISTS:
                    andGroup = andGroup && castedCondition.firstValue !== undefined && castedCondition.firstValue !== null && castedCondition.firstValue !== ''
                    break
                case BranchOperator.DOES_NOT_EXIST:
                    andGroup = andGroup && (castedCondition.firstValue === undefined || castedCondition.firstValue === null || castedCondition.firstValue === '')
                    break
            }
        }
        orOperator = orOperator || andGroup
    }
    return Boolean(orOperator)
}

function toLowercaseIfCaseInsensitive(text: unknown, caseSensitive: boolean | undefined): string {
    if (typeof text === 'string') {
        return caseSensitive ? text : text.toLowerCase()
    }
    const textAsString = JSON.stringify(text)
    return caseSensitive ? textAsString : textAsString.toLowerCase()
}

function parseStringToNumber(str: string): number | string {
    const num = Number(str)
    return isNaN(num) ? str : num
}

function parseListAsArray(input: unknown): unknown[] | undefined {
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input)
            return Array.isArray(parsed) ? parsed : undefined
        }
        catch (e) {
            return undefined
        }
    }
    return Array.isArray(input) ? input : undefined
}

function parseAndCoerceListAsArray(input: unknown): unknown[] {
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input)
            return Array.isArray(parsed) ? parsed : [parsed]
        }
        catch (e) {
            return [input]
        }
    }
    return Array.isArray(input) ? input : [input]
}

function isValidDate(date: unknown): boolean {
    if (typeof date === 'string' || typeof date === 'number' || date instanceof Date) {
        return dayjs(date).isValid()
    }
    return false
}

type RouterResolvedInput = {
    executionType: RouterExecutionType
    branches: Array<{
        branchType: BranchExecutionType
        branchName: string
        conditions?: BranchCondition[][]
    }>
}
