import { URL } from 'url'
import { ActionContext, ConnectionsManager, PauseHook, PauseHookParams, PiecePropertyMap, StaticPropsValue, StopHook, StopHookParams, TagsManager } from '@activepieces/pieces-framework'
import { ActionType, assertNotNullOrUndefined, AUTHENTICATION_PROPERTY_NAME, ExecutionType, FlowRunStatus, GenericStepOutput, isNil, PauseType, PieceAction, StepOutputStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { continueIfFailureHandler, handleExecutionError, runWithExponentialBackoff } from '../helper/error-handling'
import { PausedFlowTimeoutError } from '../helper/execution-errors'
import { pieceLoader } from '../helper/piece-loader'
import { createConnectionService } from '../services/connections.service'
import { createFilesService } from '../services/files.service'
import { createFlowsContext } from '../services/flows.service'
import { createContextStore } from '../services/storage.service'
import { propsProcessor } from '../variables/props-processor'
import { ActionHandler, BaseExecutor } from './base-executor'
import { ExecutionVerdict } from './context/flow-execution-context'

type HookResponse = { stopResponse: StopHookParams | undefined, pauseResponse: PauseHookParams | undefined, tags: string[], stopped: boolean, paused: boolean }

const AP_PAUSED_FLOW_TIMEOUT_DAYS = Number(process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS)

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
    const stepOutput = GenericStepOutput.create({
        input: {},
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

        const { resolvedInput, censoredInput } = await constants.propsResolver.resolve<StaticPropsValue<PiecePropertyMap>>({
            unresolvedInput: action.settings.input,
            executionState,
        })

        stepOutput.input = censoredInput

        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(resolvedInput, pieceAction.props, piece.auth, pieceAction.requireAuth)
        if (Object.keys(errors).length > 0) {
            throw new Error(JSON.stringify(errors, null, 2))
        }

        const hookResponse: HookResponse = {
            stopResponse: undefined,
            stopped: false,
            pauseResponse: undefined,
            paused: false,
            tags: [],
        }
        const isPaused = executionState.isPaused({ stepName: action.name })
        const context: ActionContext = {
            executionType: isPaused ? ExecutionType.RESUME : ExecutionType.BEGIN,
            resumePayload: constants.resumePayload!,
            store: createContextStore({
                apiUrl: constants.internalApiUrl,
                prefix: '',
                flowId: constants.flowId,
                engineToken: constants.engineToken,
            }),
            flows: createFlowsContext({
                engineToken: constants.engineToken,
                internalApiUrl: constants.internalApiUrl,
                flowId: constants.flowId,
                flowVersionId: constants.flowVersionId,
            }),
            auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
            files: createFilesService({
                apiUrl: constants.internalApiUrl,
                engineToken: constants.engineToken,
                stepName: action.name,
                flowId: constants.flowId,
            }),
            server: {
                token: constants.engineToken,
                apiUrl: constants.internalApiUrl,
                publicUrl: constants.publicUrl,
            },
            propsValue: processedInput,
            tags: createTagsManager(hookResponse),
            connections: createConnectionManager({
                apiUrl: constants.internalApiUrl,
                projectId: constants.projectId,
                engineToken: constants.engineToken,
                hookResponse,
            }),
            serverUrl: constants.publicUrl,
            run: {
                id: constants.flowRunId,
                stop: createStopHook(hookResponse),
                pause: createPauseHook(hookResponse, executionState.pauseRequestId),
            },
            project: {
                id: constants.projectId,
                externalId: constants.externalProjectId,
            },
            generateResumeUrl: (params) => {
                const url = new URL(`${constants.publicUrl}v1/flow-runs/${constants.flowRunId}/requests/${executionState.pauseRequestId}`)
                url.search = new URLSearchParams(params.queryParams).toString()
                return url.toString()
            },
        }
        const runMethodToExecute = (constants.testSingleStepMode && !isNil(pieceAction.test)) ? pieceAction.test : pieceAction.run
        const output = await runMethodToExecute(context)
        const newExecutionContext = executionState.addTags(hookResponse.tags)

        if (hookResponse.stopped) {
            assertNotNullOrUndefined(hookResponse.stopResponse, 'stopResponse')
            return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output)).setVerdict(ExecutionVerdict.SUCCEEDED, {
                reason: FlowRunStatus.STOPPED,
                stopResponse: hookResponse.stopResponse.response,
            }).increaseTask()
        }
        if (hookResponse.paused) {
            assertNotNullOrUndefined(hookResponse.pauseResponse, 'pauseResponse')
            return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.PAUSED))
                .setVerdict(ExecutionVerdict.PAUSED, {
                    reason: FlowRunStatus.PAUSED,
                    pauseMetadata: hookResponse.pauseResponse.pauseMetadata,
                })
        }

        return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output)).increaseTask().setVerdict(ExecutionVerdict.RUNNING, undefined)
    }
    catch (e) {
        const handledError = handleExecutionError(e)

        const failedStepOutput = stepOutput
            .setStatus(StepOutputStatus.FAILED)
            .setErrorMessage(handledError.message)

        return executionState
            .upsertStep(action.name, failedStepOutput)
            .setVerdict(ExecutionVerdict.FAILED, handledError.verdictResponse)
            .increaseTask()
    }
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

const createConnectionManager = ({ engineToken, projectId, hookResponse, apiUrl }: { projectId: string, engineToken: string, hookResponse: HookResponse, apiUrl: string }): ConnectionsManager => {
    return {
        get: async (key: string) => {
            try {
                const connection = await createConnectionService({ projectId, engineToken, apiUrl }).obtain(key)
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
    return (req?: StopHookParams) => {
        hookResponse.stopped = true
        hookResponse.stopResponse = req ?? { response: {} }
    }
}

function createPauseHook(hookResponse: HookResponse, pauseId: string): PauseHook {
    return (req) => {
        hookResponse.paused = true
        switch (req.pauseMetadata.type) {
            case PauseType.DELAY: {
                const diffInDays = dayjs(req.pauseMetadata.resumeDateTime).diff(dayjs(), 'days')
                if (diffInDays > AP_PAUSED_FLOW_TIMEOUT_DAYS) {
                    throw new PausedFlowTimeoutError(undefined, AP_PAUSED_FLOW_TIMEOUT_DAYS)
                }
                hookResponse.pauseResponse = {
                    pauseMetadata: req.pauseMetadata,
                }
                break
            }
            case PauseType.WEBHOOK:
                hookResponse.pauseResponse = {
                    pauseMetadata: {
                        ...req.pauseMetadata,
                        requestId: pauseId,
                        response: req.pauseMetadata.response ?? {},
                    },
                }
                break
        }
    }
}
