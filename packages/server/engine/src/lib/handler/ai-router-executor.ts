import { isNil } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { AI_ROUTER_MAX_STATE_LENGTH, AiRouterAction, AiRouterActionSettings, AiRouterEvaluationError, AiRouterMatchMode, AiRouterStepOutput, BranchExecutionType, ChooseAiRouteResponse, FlowActionType, FlowRunStatus, ResumePayload, StepOutputStatus } from '@activepieces/shared'
import { z } from 'zod'
import { aiRouterApi } from '../api/ai-router-api'
import { waitpointClient } from '../piece-context/waitpoint-client'
import { utils } from '../utils'
import { BaseExecutor, failStep } from './base-executor'
import { executeBranches } from './branch-execution'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'

export const aiRouterExecuter: BaseExecutor<AiRouterAction> = {
    async handle({
        action,
        executionState,
        constants,
    }) {
        const stepStartTime = performance.now()
        const stored = executionState.getStepOutput(action.name)
        if (stored?.type === FlowActionType.AI_ROUTER && stored.status === StepOutputStatus.SUCCEEDED && !isNil(stored.output)) {
            return executeBranches({
                action,
                executionState,
                constants,
                stepOutput: AiRouterStepOutput.init({ input: stored.input }).setOutput(stored.output),
                evaluations: stored.output.branches.map((branch) => branch.evaluation),
                stopAfterFirstMatch: false,
            })
        }
        const resuming = stored?.status === StepOutputStatus.PAUSED

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
        const matchMode = resolvedInput.matchMode ?? AiRouterMatchMode.BEST_MATCH
        const bestMatch = matchMode === AiRouterMatchMode.BEST_MATCH
        const options = toOptions(askableBranches({ branches: resolvedInput.branches, bestMatch }))
        const request = {
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            state: asPlainText(resolvedInput.text).slice(0, AI_ROUTER_MAX_STATE_LENGTH),
            question: asPlainText(resolvedInput.question),
            options,
            matchMode,
            flowId: constants.flowId,
            flowRunId: constants.flowRunId,
        }
        const nothingToAsk = Object.keys(options).length === 0

        if (!resuming && !nothingToAsk && canPause(constants)) {
            const { data: paused, error: pauseError } = await utils.tryCatchAndThrowOnEngineError(() =>
                pauseForAnswer({ action, executionState, constants, censoredInput, request }),
            )
            if (pauseError) {
                return failStep({
                    action,
                    executionState,
                    stepOutput: AiRouterStepOutput.init({ input: censoredInput }),
                    error: pauseError,
                    durationMs: performance.now() - stepStartTime,
                })
            }
            return paused
        }

        const { data: answer, error: answerError } = await utils.tryCatchAndThrowOnEngineError(() => {
            if (nothingToAsk) {
                return Promise.resolve<ChooseAiRouteResponse>({ matched: [] })
            }
            if (resuming) {
                return Promise.resolve(answerFromResume(constants.resumePayload))
            }
            return aiRouterApi.choose(request)
        })
        if (answerError) {
            return failStep({
                action,
                executionState,
                stepOutput: AiRouterStepOutput.init({ input: censoredInput }),
                error: answerError,
                durationMs: performance.now() - stepStartTime,
            })
        }

        const confident = confidentRoutes({ answer, minConfidence: resolvedInput.minConfidence })
        const evaluations = bestMatch
            ? bestMatchEvaluations({ branches: resolvedInput.branches, confident })
            : allMatchesEvaluations({ branches: resolvedInput.branches, confident })

        const stepOutput = AiRouterStepOutput.init({
            input: censoredInput,
        }).setOutput({
            branches: resolvedInput.branches.map((branch, index) => ({
                branchName: branch.branchName,
                branchIndex: index + 1,
                evaluation: evaluations[index],
            })),
            ...(bestMatch ? { choice: chosenName({ branches: resolvedInput.branches, evaluations }) ?? answer.matched[0] } : {}),
            ...(isNil(answer.probabilities) ? {} : { probabilities: answer.probabilities }),
        }).setDuration(performance.now() - stepStartTime)

        return executeBranches({
            action,
            executionState,
            constants,
            stepOutput,
            evaluations,
            stopAfterFirstMatch: bestMatch,
        })
    },
}

async function pauseForAnswer({ action, executionState, constants, censoredInput, request }: PauseForAnswerParams): Promise<FlowExecutorContext> {
    const waitpoint = await waitpointClient.create({
        apiUrl: constants.internalApiUrl,
        engineToken: constants.engineToken,
        flowRunId: constants.flowRunId,
        projectId: constants.projectId,
        stepName: executionState.currentPath.waitpointKeyFor({ stepName: action.name }),
        type: 'WEBHOOK',
        version: 'V1',
        resumeDateTime: new Date(Date.now() + ANSWER_BACKSTOP_MS).toISOString(),
        workerHandlerId: constants.workerHandlerId ?? undefined,
        httpRequestId: constants.httpRequestId ?? undefined,
    })
    await aiRouterApi.start({ ...request, waitpointId: waitpoint.id })
    const paused = AiRouterStepOutput.init({ input: censoredInput }).setStatus(StepOutputStatus.PAUSED)
    return (await executionState.upsertStep(action.name, paused)).incrementStepsExecuted().setVerdict({ status: FlowRunStatus.PAUSED })
}

function answerFromResume(payload: ResumePayload | undefined): ChooseAiRouteResponse {
    const parsed = ResumeBody.safeParse(payload?.body)
    if (!parsed.success || (isNil(parsed.data.output) && isNil(parsed.data.failure))) {
        throw new AiRouterEvaluationError({ message: 'The routing model did not answer before the step timed out' })
    }
    if (!isNil(parsed.data.failure)) {
        throw new AiRouterEvaluationError({ message: parsed.data.failure })
    }
    return parsed.data.output
}

function canPause(constants: EngineConstants): boolean {
    return !constants.actionRunMode && isNil(constants.stepNameToTest)
}

function askableBranches({ branches, bestMatch }: { branches: AiRouterActionSettings['branches'], bestMatch: boolean }): AiRouterActionSettings['branches'] {
    if (bestMatch) {
        return branches
    }
    return branches.filter((branch) => branch.branchType !== BranchExecutionType.FALLBACK)
}

function toOptions(branches: AiRouterActionSettings['branches']): Record<string, string> {
    const options: Record<string, string> = {}
    for (const branch of branches) {
        if (!Object.hasOwn(options, branch.branchName)) {
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

function confidentRoutes({ answer, minConfidence }: { answer: ChooseAiRouteResponse, minConfidence: number | undefined }): string[] {
    if (isNil(minConfidence)) {
        return answer.matched
    }
    return answer.matched.filter((route) => {
        const confidence = answer.probabilities?.[route]
        return isNil(confidence) || confidence >= minConfidence
    })
}

function bestMatchEvaluations({ branches, confident }: EvaluationsParams): boolean[] {
    const fallbackName = branches.find((branch) => branch.branchType === BranchExecutionType.FALLBACK)?.branchName
    const answered = confident[0]
    const known = !isNil(answered) && branches.some((branch) => branch.branchName === answered)
    const chosen = known ? answered : fallbackName
    return branches.map((branch) => branch.branchName === chosen)
}

function allMatchesEvaluations({ branches, confident }: EvaluationsParams): boolean[] {
    const matched = new Set(confident)
    const withoutFallback = branches.map((branch) => branch.branchType !== BranchExecutionType.FALLBACK && matched.has(branch.branchName))
    const nothingMatched = withoutFallback.every((match) => !match)
    return branches.map((branch, index) => branch.branchType === BranchExecutionType.FALLBACK ? nothingMatched : withoutFallback[index])
}

function chosenName({ branches, evaluations }: { branches: AiRouterActionSettings['branches'], evaluations: boolean[] }): string | undefined {
    const index = evaluations.findIndex((evaluation) => evaluation)
    return index === -1 ? undefined : branches[index].branchName
}

function asPlainText(value: unknown): string {
    if (typeof value === 'string') {
        return value
    }
    return JSON.stringify(value) ?? ''
}

type EvaluationsParams = {
    branches: AiRouterActionSettings['branches']
    confident: string[]
}

const FALLBACK_CRITERION = 'Anything that fits none of the other routes'
const ANSWER_BACKSTOP_MS = 10 * 60 * 1000

const ResumeBody = z.object({
    output: ChooseAiRouteResponse.optional(),
    failure: z.string().optional(),
})

type PauseForAnswerParams = {
    action: AiRouterAction
    executionState: FlowExecutorContext
    constants: EngineConstants
    censoredInput: unknown
    request: Parameters<typeof aiRouterApi.choose>[0]
}
