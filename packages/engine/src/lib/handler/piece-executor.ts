import { AUTHENTICATION_PROPERTY_NAME, GenricStepOutput, ActionType, ExecutionOutputStatus, PieceAction, StepOutputStatus, assertNotNullOrUndefined } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { variableService } from '../services/variable-service'
import { ActionContext, ConnectionsManager, PauseHook, PauseHookParams, PiecePropertyMap, StaticPropsValue, StopHook, StopHookParams, TagsManager } from '@activepieces/pieces-framework'
import { createContextStore } from '../services/storage.service'
import { createFilesService } from '../services/files.service'
import { createConnectionService } from '../services/connections.service'
import { EngineConstants } from './context/engine-constants'
import { pieceLoader } from '../helper/piece-loader'
import { utils } from '../utils'

type HookResponse = { stopResponse: StopHookParams | undefined, pauseResponse: PauseHookParams | undefined, tags: string[], stopped: boolean, paused: boolean }

export const pieceExecutor: BaseExecutor<PieceAction> = {
    async handle({
        action,
        executionState,
        constants,
    }: {
        action: PieceAction
        executionState: FlowExecutorContext
        constants: EngineConstants
    }) {
        if (executionState.isCompleted({ stepName: action.name })) {
            return executionState
        }

        const runWithExponentialBackoff = async (retryCount = 0): Promise<FlowExecutorContext> => {
            const {
                censoredInput,
                resolvedInput,
            } = await variableService({
                projectId: constants.projectId,
                workerToken: constants.workerToken,
            }).resolve<StaticPropsValue<PiecePropertyMap>>({
                unresolvedInput: action.settings.input,
                executionState,
            })

            const stepOutput = GenricStepOutput.create({
                input: censoredInput,
                type: ActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
            })
            try {
                assertNotNullOrUndefined(action.settings.actionName, 'actionName')
                const { pieceAction, piece } = await pieceLoader.getPieceAndActionOrThrow({
                    pieceName: action.settings.pieceName,
                    pieceVersion: action.settings.pieceVersion,
                    actionName: action.settings.actionName,
                    piecesSource: constants.piecesSource,
                })

                const { processedInput, errors } = await constants.variableService.applyProcessorsAndValidators(resolvedInput, pieceAction.props, piece.auth)
                if (Object.keys(errors).length > 0) {
                    throw new Error(JSON.stringify(errors))
                }

                const hookResponse: HookResponse = {
                    stopResponse: undefined,
                    stopped: false,
                    pauseResponse: undefined,
                    paused: false,
                    tags: [],
                }

                const context: ActionContext = {
                    executionType: constants.executionType,
                    store: createContextStore({
                        prefix: '',
                        flowId: constants.flowId,
                        workerToken: constants.workerToken,
                    }),
                    auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
                    files: createFilesService({
                        workerToken: constants.workerToken,
                        stepName: action.name,
                        flowId: constants.flowId,
                        type: constants.filesServiceType,
                    }),
                    server: {
                        token: constants.workerToken,
                        apiUrl: constants.apiUrl,
                        publicUrl: constants.serverUrl,
                    },
                    propsValue: processedInput,
                    tags: createTagsManager(hookResponse),
                    connections: createConnectionManager({
                        projectId: constants.projectId,
                        workerToken: constants.workerToken,
                        hookResponse,
                    }),
                    serverUrl: constants.serverUrl,
                    run: {
                        id: constants.flowRunId,
                        stop: createStopHook(hookResponse),
                        pause: createPauseHook(hookResponse),
                    },
                    resumePayload: constants.resumePayload,
                    project: {
                        id: constants.projectId,
                        externalId: constants.externalProjectId,
                    },
                }
                const output = await pieceAction.run(context)
                const newExecutionContext = executionState.addTags(hookResponse.tags)

                if (hookResponse.stopped) {
                    assertNotNullOrUndefined(hookResponse.stopResponse, 'stopResponse')
                    return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output)).setVerdict(ExecutionVerdict.SUCCEEDED, {
                        reason: ExecutionOutputStatus.STOPPED,
                        stopResponse: hookResponse.stopResponse.response,
                    }).increaseTask()
                }
                if (hookResponse.paused) {
                    assertNotNullOrUndefined(hookResponse.pauseResponse, 'pauseResponse')
                    return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output)
                        .setStatus(StepOutputStatus.PAUSED))
                        .setVerdict(ExecutionVerdict.PAUSED, {
                            reason: ExecutionOutputStatus.PAUSED,
                            pauseMetadata: hookResponse.pauseResponse.pauseMetadata,
                        })
                }

                return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output)).increaseTask().setVerdict(ExecutionVerdict.RUNNING, undefined)
            }
            catch (e) {
                const errorMessage = await utils.tryParseJson((e as Error).message)
                console.error(errorMessage)

                if (!constants.testSingleStepMode && action.settings.errorHandlingOptions?.retryOnFailure.value && retryCount < EngineConstants.MAX_RETRIES) {
                    const backoffTime = Math.pow(6, retryCount) * 1000
                    await new Promise(resolve => setTimeout(resolve, backoffTime))
                    return runWithExponentialBackoff(retryCount + 1)
                }
 
                if (!constants.testSingleStepMode && action.settings.errorHandlingOptions?.continueOnFailure.value) {
                    return executionState.upsertStep(action.name, stepOutput.setStatus(StepOutputStatus.FAILED).setErrorMessage(errorMessage)).increaseTask().setVerdict(ExecutionVerdict.RUNNING, undefined)
                }
                else {
                    return executionState
                        .upsertStep(action.name, stepOutput.setStatus(StepOutputStatus.FAILED).setErrorMessage(errorMessage))
                        .setVerdict(ExecutionVerdict.FAILED, undefined)
                }
            }
        }

        // Initial call
        return runWithExponentialBackoff()
    },
}

const createTagsManager = (hookResponse: HookResponse): TagsManager => {
    return {
        add: async (params: {
            name: string
        }): Promise<void> => {
            hookResponse.tags.push(params.name)
        },

    }
}

const createConnectionManager = ({ workerToken, projectId, hookResponse }: { projectId: string, workerToken: string, hookResponse: HookResponse }): ConnectionsManager => {
    return {
        get: async (key: string) => {
            try {
                const connection = await createConnectionService({ projectId, workerToken }).obtain(key)
                hookResponse.tags.push(`connection:${key}`)
                return connection
            }
            catch (e) {
                return null
            }
        },
    }
}

function createStopHook(hookResponse: HookResponse): StopHook {
    return (req: StopHookParams) => {
        hookResponse.stopped = true
        hookResponse.stopResponse = req
    }
}

function createPauseHook(hookResponse: HookResponse): PauseHook {
    return (req: PauseHookParams) => {
        hookResponse.paused = true
        hookResponse.pauseResponse = req
    }
}
