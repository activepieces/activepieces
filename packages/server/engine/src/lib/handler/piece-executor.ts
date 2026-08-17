import { isNil } from '@activepieces/core-utils'
import { PiecePropertyMap, StaticPropsValue, StopHookParams } from '@activepieces/pieces-framework'
import { EngineGenericError, FlowActionType, FlowRunStatus, GenericStepOutput, PieceAction, RespondResponse, StepOutputStatus } from '@activepieces/shared'
import { engineRunApi } from '../api/engine-run-api'
import { continueIfFailureHandler, runWithExponentialBackoff } from '../helper/error-handling'
import { flowRunProgressReporter } from '../helper/flow-run-progress-reporter'
import { pieceClient } from '../piece-process/piece-client'
import { HookResponse, utils } from '../utils'
import { ActionHandler, BaseExecutor, failStep } from './base-executor'
import { engineConstantsToParams } from './context/engine-constants'

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
        if (isNil(action.settings.actionName)) {
            throw new EngineGenericError('ActionNameNotSetError', 'Action name is not set')
        }

        const contextVersion = await pieceClient.getContextVersion({
            pieceName: action.settings.pieceName,
            pieceVersion: action.settings.pieceVersion,
            devPieces: constants.devPieces,
        })

        const { resolvedInput, censoredInput } = await constants.getPropsResolver({ contextVersion, pieceName: action.settings.pieceName }).resolve<StaticPropsValue<PiecePropertyMap>>({
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
        const { output, hookResponse } = await pieceClient.runAction({
            pieceName: action.settings.pieceName,
            pieceVersion: action.settings.pieceVersion,
            actionName: action.settings.actionName,
            devPieces: constants.devPieces,
            constantsParams: engineConstantsToParams(constants),
            resolvedInput,
            propertySettings: action.settings.propertySettings,
            isPaused,
            testSingleStepMode,
        })

        const newExecutionContext = executionState.addTags(hookResponse.tags)

        const webhookResponse = getResponse(hookResponse)
        const isSamePiece = constants.triggerPieceName === action.settings.pieceName
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
        if (hookResponse.type === 'stopped') {
            if (isNil(hookResponse.response)) {
                throw new EngineGenericError('StopResponseNotSetError', 'Stop response is not set')
            }
            const succeeded = stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(stepEndTime - stepStartTime)
            return (await newExecutionContext.upsertStep(action.name, succeeded)).incrementStepsExecuted().setVerdict({
                status: FlowRunStatus.SUCCEEDED,
                stopResponse: (hookResponse.response as StopHookParams).response,
            })
        }
        if (hookResponse.type === 'paused') {
            const paused = stepOutput.setOutput(output).setStatus(StepOutputStatus.PAUSED).setDuration(stepEndTime - stepStartTime)
            return (await newExecutionContext.upsertStep(action.name, paused))
                .incrementStepsExecuted()
                .setVerdict({ status: FlowRunStatus.PAUSED })
        }
        const succeeded = stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(stepEndTime - stepStartTime)
        return (await newExecutionContext.upsertStep(action.name, succeeded)).incrementStepsExecuted().setVerdict({ status: FlowRunStatus.RUNNING })

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
