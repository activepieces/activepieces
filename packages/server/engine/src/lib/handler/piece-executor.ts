import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { PiecePropertyMap, StaticPropsValue } from '@activepieces/pieces-framework'
import { collectSensitiveOutputPaths, EngineGenericError, ExecutionType, FlowActionType, FlowRunStatus, GenericStepOutput, PieceAction, RespondResponse, StepOutputStatus } from '@activepieces/shared'
import { engineRunApi } from '../api/engine-run-api'
import { PieceRuntime } from '../core/piece/piece-protocol'
import { pieceRunner } from '../core/piece/piece-runner'
import { continueIfFailureHandler, runWithExponentialBackoff } from '../helper/error-handling'
import { flowRunProgressReporter } from '../helper/flow-run-progress-reporter'
import { HookResponse, utils } from '../utils'
import { ActionHandler, BaseExecutor, failStep } from './base-executor'
import { EngineConstants } from './context/engine-constants'

export const pieceExecutor: BaseExecutor<PieceAction> = {
    async handle({
        action,
        executionState,
        constants,
    }) {
        if (executionState.isCompleted({ stepName: action.name })) {
            return executionState
        }
        const resultExecution = await runWithExponentialBackoff(executionState, action, constants, executeAction)
        return continueIfFailureHandler(resultExecution, action, constants)
    },
}

const executeAction: ActionHandler<PieceAction> = async ({ action, executionState, constants }) => {
    const stepStartTime = performance.now()
    const stepOutput = GenericStepOutput.create({
        input: {},
        type: FlowActionType.PIECE,
        status: StepOutputStatus.RUNNING,
    })

    const { data: executionStateResult, error: executionStateError } = await utils.tryCatchAndThrowOnEngineError((async () => {
        const { actionName, pieceName, pieceVersion, propertySettings } = action.settings
        if (isNil(actionName)) {
            throw new EngineGenericError('ActionNameNotSetError', 'Action name is not set')
        }

        const piece = { pieceName, pieceVersion, devPieces: constants.devPieces }
        const description = await pieceRunner.describe(piece)
        const actionDescription = description.metadata.actions[actionName]
        if (isNil(actionDescription)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'step',
                    entityId: actionName,
                    message: `Action not found for piece ${pieceName}@${pieceVersion}`,
                    extra: { pieceName, pieceVersion },
                },
            })
        }
        const contextVersion = description.metadata.contextInfo?.version

        const { resolvedInput, censoredInput } = await constants.getPropsResolver({ contextVersion, pieceName }).resolve<StaticPropsValue<PiecePropertyMap>>({
            unresolvedInput: action.settings.input,
            executionState,
        })
        stepOutput.input = censoredInput

        const isPaused = executionState.isPaused({ stepName: action.name })
        if (!isPaused) {
            await flowRunProgressReporter.sendUpdate({
                engineConstants: constants,
                flowExecutorContext: await executionState.upsertStep(action.name, stepOutput),
                stepNameToUpdate: action.name,
            })
        }

        const testSingleStepMode = !isNil(constants.stepNameToTest)
        const useTestMethod = testSingleStepMode && description.hasPath(['actions', actionName, 'test'])
        const { result: output, hooks } = await pieceRunner.call({
            piece,
            path: ['actions', actionName, useTestMethod ? 'test' : 'run'],
            context: {
                kind: 'action',
                runtime: buildRuntime({ constants, pieceName, contextVersion }),
                actionName,
                stepName: action.name,
                resolvedInput,
                propertySettings,
                executionType: isPaused ? ExecutionType.RESUME : ExecutionType.BEGIN,
                resumePayload: constants.resumePayload,
            },
        })

        const sensitiveOutputPaths = collectSensitiveOutputPaths(actionDescription.outputSchema, output)
        const hookResponse: HookResponse = hooks?.hookResponse ?? { type: 'none', tags: [] }
        const newExecutionContext = executionState.addTags(hookResponse.tags)

        const webhookResponse = getResponse(hookResponse)
        const isSamePiece = constants.triggerPieceName === pieceName
        if (!isNil(webhookResponse) && !isNil(constants.workerHandlerId) && !isNil(constants.httpRequestId) && isSamePiece) {
            await engineRunApi.sendFlowResponse({
                apiUrl: constants.internalApiUrl,
                engineToken: constants.engineToken,
                request: {
                    workerHandlerId: constants.workerHandlerId,
                    httpRequestId: constants.httpRequestId,
                    runResponse: {
                        status: webhookResponse.status ?? 200,
                        body: webhookResponse.body ?? {},
                        headers: webhookResponse.headers ?? {},
                    },
                },
            })
        }

        const stepEndTime = performance.now()
        const finished = stepOutput.setOutput(output).setDuration(stepEndTime - stepStartTime).setSensitiveOutputPaths(sensitiveOutputPaths)
        if (hookResponse.type === 'stopped') {
            if (isNil(hookResponse.response)) {
                throw new EngineGenericError('StopResponseNotSetError', 'Stop response is not set')
            }
            return (await newExecutionContext.upsertStep(action.name, finished.setStatus(StepOutputStatus.SUCCEEDED))).incrementStepsExecuted().setVerdict({
                status: FlowRunStatus.SUCCEEDED,
                stopResponse: hookResponse.response.response,
            })
        }
        if (hookResponse.type === 'paused') {
            return (await newExecutionContext.upsertStep(action.name, finished.setStatus(StepOutputStatus.PAUSED)))
                .incrementStepsExecuted()
                .setVerdict({ status: FlowRunStatus.PAUSED })
        }
        return (await newExecutionContext.upsertStep(action.name, finished.setStatus(StepOutputStatus.SUCCEEDED))).incrementStepsExecuted().setVerdict({ status: FlowRunStatus.RUNNING })

    }))

    if (executionStateError) {
        return failStep({
            action,
            executionState,
            stepOutput,
            error: executionStateError,
            durationMs: performance.now() - stepStartTime,
        })
    }

    return executionStateResult
}

function getResponse(hookResponse: HookResponse): RespondResponse | undefined {
    switch (hookResponse.type) {
        case 'stopped':
        case 'respond':
            return hookResponse.response.response
        case 'paused':
            return hookResponse.responseToSend
        case 'none':
            return undefined
    }
}

export function buildRuntime({ constants, pieceName, contextVersion }: BuildRuntimeParams): PieceRuntime {
    return {
        internalApiUrl: constants.internalApiUrl,
        publicApiUrl: constants.publicApiUrl,
        engineToken: constants.engineToken,
        projectId: constants.projectId,
        flowId: constants.flowId,
        flowVersionId: constants.flowVersionId,
        flowRunId: constants.flowRunId,
        pieceName,
        contextVersion,
        actionRunMode: constants.actionRunMode,
        workerHandlerId: constants.workerHandlerId ?? undefined,
        httpRequestId: constants.httpRequestId ?? undefined,
    }
}

type BuildRuntimeParams = {
    constants: EngineConstants
    pieceName: string
    contextVersion?: PieceRuntime['contextVersion']
}
