import { isNil } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { AiRouterAction, AiRouterActionSettings, AiRouterStepOutput, BranchExecutionType, ChooseAiRouteResponse } from '@activepieces/shared'
import { aiRouterApi } from '../api/ai-router-api'
import { utils } from '../utils'
import { BaseExecutor, failStep } from './base-executor'
import { executeBranches } from './branch-execution'

const FALLBACK_CRITERION = 'Anything that fits none of the other routes'

export const aiRouterExecuter: BaseExecutor<AiRouterAction> = {
    async handle({
        action,
        executionState,
        constants,
    }) {
        const stepStartTime = performance.now()
        const { data: resolved, error: resolveError } = await utils.tryCatchAndThrowOnEngineError(() =>
            constants.getPropsResolver({ contextVersion: LATEST_CONTEXT_VERSION }).resolve<AiRouterActionSettings>({
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
                stepOutput: AiRouterStepOutput.init({ input: {} }),
                error: resolveError,
                durationMs: performance.now() - stepStartTime,
            })
        }
        const { censoredInput, resolvedInput } = resolved

        const { data: answer, error: answerError } = await utils.tryCatchAndThrowOnEngineError(() =>
            aiRouterApi.choose({
                apiUrl: constants.internalApiUrl,
                engineToken: constants.engineToken,
                state: asPlainText(resolvedInput.text),
                question: asPlainText(resolvedInput.question),
                options: toOptions(resolvedInput.branches),
            }),
        )
        if (answerError) {
            return failStep({
                action,
                executionState,
                stepOutput: AiRouterStepOutput.init({ input: censoredInput }),
                error: answerError,
                durationMs: performance.now() - stepStartTime,
            })
        }

        const chosen = chosenBranchName({ answer, branches: resolvedInput.branches, minConfidence: resolvedInput.minConfidence })
        const evaluations = resolvedInput.branches.map((branch) => branch.branchName === chosen)

        const stepOutput = AiRouterStepOutput.init({
            input: censoredInput,
        }).setOutput({
            branches: resolvedInput.branches.map((branch, index) => ({
                branchName: branch.branchName,
                branchIndex: index + 1,
                evaluation: evaluations[index],
            })),
            choice: chosen ?? answer.choice,
            ...(isNil(answer.probabilities) ? {} : { probabilities: answer.probabilities }),
        }).setDuration(performance.now() - stepStartTime)

        return executeBranches({
            action,
            executionState,
            constants,
            stepOutput,
            evaluations,
            stopAfterFirstMatch: true,
        })
    },
}

function toOptions(branches: AiRouterActionSettings['branches']): Record<string, string> {
    const options: Record<string, string> = {}
    for (const branch of branches) {
        if (isNil(options[branch.branchName])) {
            options[branch.branchName] = criterionOf(branch)
        }
    }
    return options
}

function criterionOf(branch: AiRouterActionSettings['branches'][number]): string {
    const description = branch.description?.trim()
    if (!isNil(description) && description.length > 0) {
        return description
    }
    return branch.branchType === BranchExecutionType.FALLBACK ? FALLBACK_CRITERION : branch.branchName
}

function chosenBranchName({ answer, branches, minConfidence }: ChosenBranchNameParams): string | undefined {
    const fallbackName = branches.find((branch) => branch.branchType === BranchExecutionType.FALLBACK)?.branchName
    const known = branches.some((branch) => branch.branchName === answer.choice)
    if (!known) {
        return fallbackName
    }
    const confidence = answer.probabilities?.[answer.choice]
    if (isNil(minConfidence) || isNil(confidence) || confidence >= minConfidence) {
        return answer.choice
    }
    return fallbackName
}

function asPlainText(value: unknown): string {
    if (typeof value === 'string') {
        return value
    }
    return JSON.stringify(value) ?? ''
}

type ChosenBranchNameParams = {
    answer: ChooseAiRouteResponse
    branches: AiRouterActionSettings['branches']
    minConfidence: number | undefined
}
