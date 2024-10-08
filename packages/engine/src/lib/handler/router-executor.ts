import { assertNotNullOrUndefined, BranchCondition, BranchExecutionType, BranchOperator, RouterAction, RouterActionSettings, RouterExecutionType, RouterStepOutput, StepOutputStatus, isNil } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'

export const routerExecuter: BaseExecutor<RouterAction> = {
    async handle({
        action,
        executionState,
        constants,
    }: {
        action: RouterAction
        executionState: FlowExecutorContext
        constants: EngineConstants
    }) {
        const { censoredInput, resolvedInput } = await constants.variableService.resolve<RouterActionSettings>({
            unresolvedInput: action.settings,
            executionState,
        })

        switch (resolvedInput.executionType) {
            case RouterExecutionType.EXECUTE_ALL_MATCH:
                return handleRouterExecution({ action, executionState, constants, censoredInput, resolvedInput, routerExecutionType: RouterExecutionType.EXECUTE_ALL_MATCH })
            case RouterExecutionType.EXECUTE_FIRST_MATCH:
                return handleRouterExecution({ action, executionState, constants, censoredInput, resolvedInput, routerExecutionType: RouterExecutionType.EXECUTE_FIRST_MATCH })
            default:
                throw new Error(`Router execution type ${resolvedInput.executionType} is not supported`)
        }
    },
}

async function handleRouterExecution({ action, executionState, constants, censoredInput, resolvedInput, routerExecutionType }: {
    action: RouterAction
    executionState: FlowExecutorContext
    constants: EngineConstants
    censoredInput: unknown
    resolvedInput: RouterActionSettings
    routerExecutionType: RouterExecutionType
}): Promise<FlowExecutorContext> {

    const evaluatedConditions = resolvedInput.branches.map((branch) => {
        return branch.branchType === BranchExecutionType.FALLBACK ? true : evaluateConditions(branch.conditions)
    })

    const routerOutput = RouterStepOutput.init({
        input: censoredInput,
    }).setOutput({
        conditions: evaluatedConditions,
    })
    executionState = executionState.upsertStep(action.name, routerOutput)

    try {
        for (let i = 0; i < resolvedInput.branches.length; i++) {
            if (evaluatedConditions[i]) {
                executionState = (await flowExecutor.execute({
                    action: action.children[i],
                    executionState,
                    constants,
                }))
                if (routerExecutionType === RouterExecutionType.EXECUTE_FIRST_MATCH) {
                    break
                }
            }
        }
        return executionState
    }
    catch (e) {
        console.error(e)
        const failedStepOutput = routerOutput.setStatus(StepOutputStatus.FAILED)
        return executionState.upsertStep(action.name, failedStepOutput).setVerdict(ExecutionVerdict.FAILED, undefined)
    }
}


function evaluateConditions(conditionGroups: BranchCondition[][]): boolean {
    let orOperator = false
    for (const conditionGroup of conditionGroups) {
        let andGroup = true
        for (const condition of conditionGroup) {
            const castedCondition = condition
            assertNotNullOrUndefined(castedCondition.operator, 'The operator is required but found to be undefined')
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
    else {
        return caseSensitive ? JSON.stringify(text) : JSON.stringify(text).toLowerCase()
    }
}

function parseStringToNumber(str: string): number | string {
    const num = Number(str)
    return isNaN(num) ? str : num
}
