import { assertNotNullOrUndefined, BranchAction, BranchActionSettings, BranchCondition, BranchOperator, BranchStepOutput, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'

export const branchExecutor: BaseExecutor<BranchAction> = {
    async handle({
        action,
        executionState,
        constants,
    }: {
        action: BranchAction
        executionState: FlowExecutorContext
        constants: EngineConstants
    }) {
        const { censoredInput, resolvedInput } = await constants.variableService.resolve<BranchActionSettings>({
            unresolvedInput: action.settings,
            executionState,
        })

        const evaluatedCondition = evaluateConditions(resolvedInput.conditions)
        const stepOutput = BranchStepOutput.init({
            input: censoredInput,
        }).setOutput({
            condition: evaluatedCondition,
        })

        try {
            let branchExecutionContext = executionState.upsertStep(action.name, stepOutput)

            if (!evaluatedCondition && action.onFailureAction) {
                branchExecutionContext = await flowExecutor.execute({
                    action: action.onFailureAction,
                    executionState: branchExecutionContext,
                    constants,
                })
            }
            if (evaluatedCondition && action.onSuccessAction) {
                branchExecutionContext = (await flowExecutor.execute({
                    action: action.onSuccessAction,
                    executionState: branchExecutionContext,
                    constants,
                }))
            }

            return branchExecutionContext
        }
        catch (e) {
            console.error(e)
            const failedStepOutput = stepOutput.setErrorMessage((e as Error).message).setStatus(StepOutputStatus.FAILED)
            return executionState.upsertStep(action.name, failedStepOutput).setVerdict(ExecutionVerdict.FAILED, undefined)
        }
    },
}


export function evaluateConditions(conditionGroups: BranchCondition[][]): boolean {
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
                case BranchOperator.DATE_IS_AFTER:
                    andGroup = andGroup && compareDates(castedCondition.firstValue, castedCondition.secondValue, (d1, d2) => d1 > d2)
                    break
                case BranchOperator.DATE_IS_EQUAL:
                    andGroup = andGroup && compareDates(castedCondition.firstValue, castedCondition.secondValue, (d1, d2) => d1.getTime() == d2.getTime())
                    break
                case BranchOperator.DATE_IS_BEFORE:
                    andGroup = andGroup && compareDates(castedCondition.firstValue, castedCondition.secondValue, (d1, d2) => d1 < d2)
                    break
                case BranchOperator.LIST_IS_EMPTY: {
                    const list = parseToList(castedCondition.firstValue)
                    andGroup = andGroup && Array.isArray(list) && list?.length === 0
                    break
                }
                case BranchOperator.LIST_IS_NOT_EMPTY: {
                    const list = parseToList(castedCondition.firstValue)
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
    else {
        return caseSensitive ? JSON.stringify(text) : JSON.stringify(text).toLowerCase()
    }
}

function parseStringToNumber(str: string): number | string {
    const num = Number(str)
    return isNaN(num) ? str : num
}

function parseToList(input: unknown): [] | undefined {
    if (typeof input === 'string') {
        try {
            return JSON.parse(input)
        }
        catch (e) {
            return undefined
        }
    }
    return input as []
}

function compareDates(date1: string, date2: string, compareFunc: (d1: Date, d2: Date) => boolean): boolean {
    if (!date1 || !date2) {
        return false
    }

    const parsedDate1 = new Date(date1)
    const parsedDate2 = new Date(date2)

    if (!isNaN(parsedDate1.getTime()) && !isNaN(parsedDate2.getTime())) {
        return compareFunc(parsedDate1, parsedDate2)
    }
    return false
}
