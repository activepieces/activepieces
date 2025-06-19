import { URL } from 'url'
import { ActionContext, InputPropertyMap, PauseHook, PauseHookParams, PiecePropertyMap, RespondHook, RespondHookParams, StaticPropsValue, StopHook, StopHookParams, TagsManager } from '@activepieces/pieces-framework'
import { ActionType, assertNotNullOrUndefined, AUTHENTICATION_PROPERTY_NAME, ExecutionType, FlowRunStatus, GenericStepOutput, isNil, PauseType, PieceAction, RespondResponse, StepOutputStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { continueIfFailureHandler, handleExecutionError, runWithExponentialBackoff } from '../helper/error-handling'
import { PausedFlowTimeoutError } from '../helper/execution-errors'
import { pieceLoader } from '../helper/piece-loader'
import { createFlowsContext } from '../services/flows.service'
import { progressService } from '../services/progress.service'
import { createFilesService } from '../services/step-files.service'
import { createContextStore } from '../services/storage.service'
import { HookResponse, utils } from '../utils'
import { propsProcessor } from '../variables/props-processor'
import { ActionHandler, BaseExecutor } from './base-executor'
import { ExecutionVerdict } from './context/flow-execution-context'




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

        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(resolvedInput, pieceAction.props, piece.auth, pieceAction.requireAuth, action.settings.inputUiInfo?.schema as Record<string, InputPropertyMap> | undefined)
        if (Object.keys(errors).length > 0) {
            throw new Error(JSON.stringify(errors, null, 2))
        }

        const params: {
            hookResponse: HookResponse
        } = {
            hookResponse: {
                type: 'none',
                tags: [],
            },
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
                publicUrl: constants.publicApiUrl,
            },
            propsValue: processedInput,
            tags: createTagsManager(params),
            connections: utils.createConnectionManager({
                apiUrl: constants.internalApiUrl,
                projectId: constants.projectId,
                engineToken: constants.engineToken,
                target: 'actions',
                hookResponse: params.hookResponse,
            }),
            /*
                @deprecated Use server.publicApiUrl instead.
            */
            serverUrl: constants.publicApiUrl,
            run: {
                id: constants.flowRunId,
                stop: createStopHook(params),
                pause: createPauseHook(params, executionState.pauseRequestId),
                respond: createRespondHook(params),
            },
            project: {
                id: constants.projectId,
                externalId: constants.externalProjectId,
            },
            generateResumeUrl: (params) => {
                const url = new URL(`${constants.publicApiUrl}v1/flow-runs/${constants.flowRunId}/requests/${executionState.pauseRequestId}${params.sync ? '/sync' : ''}`)
                url.search = new URLSearchParams(params.queryParams).toString()
                return url.toString()
            },
        }
        const runMethodToExecute = (constants.testSingleStepMode && !isNil(pieceAction.test)) ? pieceAction.test : pieceAction.run
        const output = await runMethodToExecute(context)
        const newExecutionContext = executionState.addTags(params.hookResponse.tags)

        const webhookResponse = getResponse(params.hookResponse)
        if (!isNil(webhookResponse) && !isNil(constants.serverHandlerId) && !isNil(constants.httpRequestId)) {
            await progressService.sendFlowResponse(constants, {
                workerHandlerId: constants.serverHandlerId,
                httpRequestId: constants.httpRequestId,
                runResponse: {
                    status: webhookResponse.status ?? 200,
                    body: webhookResponse.body,
                    headers: webhookResponse.headers ?? {},
                },
            })
        }

        if (params.hookResponse.type === 'stopped') {
            assertNotNullOrUndefined(params.hookResponse.response, 'stopResponse')
            return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output)).setVerdict(ExecutionVerdict.SUCCEEDED, {
                reason: FlowRunStatus.STOPPED,
                stopResponse: (params.hookResponse.response as StopHookParams).response,
            }).increaseTask()
        }
        if (params.hookResponse.type === 'paused') {
            assertNotNullOrUndefined(params.hookResponse.response, 'pauseResponse')
            return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.PAUSED))
                .setVerdict(ExecutionVerdict.PAUSED, {
                    reason: FlowRunStatus.PAUSED,
                    pauseMetadata: (params.hookResponse.response as PauseHookParams).pauseMetadata,
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

function getResponse(hookResponse: HookResponse): RespondResponse | undefined {
    switch (hookResponse.type) {
        case 'stopped':
            return hookResponse.response.response
        case 'respond':
            return hookResponse.response.response
        case 'paused':
            if (hookResponse.response.pauseMetadata.type === PauseType.WEBHOOK) {
                return hookResponse.response.pauseMetadata.response
            }
            else {
                return undefined
            }
        case 'none':
            return undefined
    }
}

const createTagsManager = (hkParams: createTagsManagerParams): TagsManager => {
    return {
        add: async (params: addTagsParams): Promise<void> => {
            hkParams.hookResponse.tags.push(params.name)
        },

    }
}

type addTagsParams = {
    name: string
}

type createTagsManagerParams = {
    hookResponse: HookResponse
}


function createStopHook(params: CreateStopHookParams): StopHook {
    return (req?: StopHookParams) => {
        params.hookResponse = {
            ...params.hookResponse,
            type: 'stopped',
            response: req ?? { response: {} },
        }
    }
}
type CreateStopHookParams = {
    hookResponse: HookResponse
}

function createRespondHook(params: CreateRespondHookParams): RespondHook {
    return (req?: RespondHookParams) => {
        params.hookResponse = {
            ...params.hookResponse,
            type: 'respond',
            response: req ?? { response: {} },
        }
    }
}

type CreateRespondHookParams = {
    hookResponse: HookResponse
}

function createPauseHook(params: CreatePauseHookParams, pauseId: string): PauseHook {
    return (req) => {
        switch (req.pauseMetadata.type) {
            case PauseType.DELAY: {
                const diffInDays = dayjs(req.pauseMetadata.resumeDateTime).diff(dayjs(), 'days')
                if (diffInDays > AP_PAUSED_FLOW_TIMEOUT_DAYS) {
                    throw new PausedFlowTimeoutError(undefined, AP_PAUSED_FLOW_TIMEOUT_DAYS)
                }
                params.hookResponse = {
                    ...params.hookResponse,
                    type: 'paused',
                    response: {
                        pauseMetadata: req.pauseMetadata,
                    },
                }
                break
            }
            case PauseType.WEBHOOK:
                params.hookResponse = {
                    ...params.hookResponse,
                    type: 'paused',
                    response: {
                        pauseMetadata: {
                            ...req.pauseMetadata,
                            requestId: pauseId,
                            response: req.pauseMetadata.response ?? {},
                        },
                    },
                }
                break
        }
    }
}

type CreatePauseHookParams = {
    hookResponse: HookResponse
}
