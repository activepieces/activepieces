import { URL } from 'url'
import { ActionContext, backwardCompatabilityContextUtils, ConstructToolParams, InputPropertyMap, PauseHook, PauseHookParams, PieceAuthProperty, PiecePropertyMap, RespondHook, RespondHookParams, StaticPropsValue, StopHook, StopHookParams, TagsManager } from '@activepieces/pieces-framework'
import { AUTHENTICATION_PROPERTY_NAME, EngineGenericError, EngineSocketEvent, ExecutionType, FlowActionType, FlowRunStatus, GenericStepOutput, isNil, PausedFlowTimeoutError, PauseType, PieceAction, RespondResponse, StepOutputStatus } from '@activepieces/shared'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { ToolSet } from 'ai'
import dayjs from 'dayjs'
import { continueIfFailureHandler, runWithExponentialBackoff } from '../helper/error-handling'
import { pieceLoader } from '../helper/piece-loader'
import { createFlowsContext } from '../services/flows.service'
import { progressService } from '../services/progress.service'
import { createFilesService } from '../services/step-files.service'
import { createContextStore } from '../services/storage.service'
import { agentTools } from '../tools'
import { HookResponse, utils } from '../utils'
import { propsProcessor } from '../variables/props-processor'
import { workerSocket } from '../worker-socket'
import { ActionHandler, BaseExecutor } from './base-executor'

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
        
        const { pieceAction, piece } = await pieceLoader.getPieceAndActionOrThrow({
            pieceName: action.settings.pieceName,
            pieceVersion: action.settings.pieceVersion,
            actionName: action.settings.actionName,
            devPieces: constants.devPieces,
        })

        const { resolvedInput, censoredInput } = await constants.getPropsResolver(piece.getContextInfo?.().version).resolve<StaticPropsValue<PiecePropertyMap>>({
            unresolvedInput: action.settings.input,
            executionState,
        })

        stepOutput.input = censoredInput
    
        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(resolvedInput, pieceAction.props, piece.auth, pieceAction.requireAuth, action.settings.propertySettings)
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
        const outputContext = progressService.createOutputContext({
            engineConstants: constants,
            flowExecutorContext: executionState,
            stepName: action.name,
            stepOutput,
        })

        const isPaused = executionState.isPaused({ stepName: action.name })
        if (!isPaused) {
            await progressService.sendUpdate({
                engineConstants: constants,
                flowExecutorContext: executionState.upsertStep(action.name, stepOutput),
            })
        }
        const context: ActionContext<PieceAuthProperty, InputPropertyMap> = {
            executionType: isPaused ? ExecutionType.RESUME : ExecutionType.BEGIN,
            resumePayload: constants.resumePayload!,
            store: createContextStore({
                apiUrl: constants.internalApiUrl,
                prefix: '',
                flowId: constants.flowId,
                engineToken: constants.engineToken,
            }),
            output: outputContext,
            flows: createFlowsContext({
                engineToken: constants.engineToken,
                internalApiUrl: constants.internalApiUrl,
                flowId: constants.flowId,
                flowVersionId: constants.flowVersionId,
            }),
            step: {
                name: action.name,
            },
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
            agent: {
                tools: async (params: ConstructToolParams): Promise<ToolSet> => agentTools.tools({
                    engineConstants: constants,
                    tools: params.tools,
                    model: params.model as LanguageModelV2,
                }),
            },
            propsValue: processedInput,
            tags: createTagsManager(params),
            connections: utils.createConnectionManager({
                apiUrl: constants.internalApiUrl,
                projectId: constants.projectId,
                engineToken: constants.engineToken,
                target: 'actions',
                hookResponse: params.hookResponse,
                contextVersion: piece.getContextInfo?.().version,
            }),
            run: {
                id: constants.flowRunId,
                stop: createStopHook(params),
                pause: createPauseHook(params, executionState.pauseRequestId, constants.httpRequestId),
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
        const backwardCompatibleContext = backwardCompatabilityContextUtils.makeActionContextBackwardCompatible({
            contextVersion: piece.getContextInfo?.().version,
            context,
        })
        const testSingleStepMode = !isNil(constants.stepNameToTest)
        const runMethodToExecute = (testSingleStepMode && !isNil(pieceAction.test)) ? pieceAction.test : pieceAction.run
        const output = await runMethodToExecute(backwardCompatibleContext)
        const newExecutionContext = executionState.addTags(params.hookResponse.tags)

        const webhookResponse = getResponse(params.hookResponse)
        const isSamePiece = constants.triggerPieceName === action.settings.pieceName
        if (!isNil(webhookResponse) && !isNil(constants.serverHandlerId) && !isNil(constants.httpRequestId) && isSamePiece) {
            await workerSocket.sendToWorkerWithAck(EngineSocketEvent.SEND_FLOW_RESPONSE, {
                workerHandlerId: constants.serverHandlerId,
                httpRequestId: constants.httpRequestId,
                runResponse: {
                    status: webhookResponse.status ?? 200,
                    body: webhookResponse.body ?? {},
                    headers: webhookResponse.headers ?? {},
                },
            })
        }

        const stepEndTime = performance.now()
        if (params.hookResponse.type === 'stopped') {
            if (isNil(params.hookResponse.response)) {
                throw new EngineGenericError('StopResponseNotSetError', 'Stop response is not set')
            }

            return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(stepEndTime - stepStartTime)).incrementStepsExecuted().setVerdict({
                status: FlowRunStatus.SUCCEEDED,
                stopResponse: (params.hookResponse.response as StopHookParams).response,
            })
        }
        if (params.hookResponse.type === 'paused') {
            if (isNil(params.hookResponse.response)) {
                throw new EngineGenericError('PauseResponseNotSetError', 'Pause response is not set')
            }

            return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.PAUSED).setDuration(stepEndTime - stepStartTime)).incrementStepsExecuted()
                .setVerdict({
                    status: FlowRunStatus.PAUSED,
                    pauseMetadata: (params.hookResponse.response as PauseHookParams).pauseMetadata,
                })
        }
        return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(stepEndTime - stepStartTime)).incrementStepsExecuted().setVerdict({ status: FlowRunStatus.RUNNING })

    }))

    if (executionStateError) {
        const failedStepOutput = stepOutput
            .setStatus(StepOutputStatus.FAILED)
            .setErrorMessage(utils.formatError(executionStateError))
            .setDuration(performance.now() - stepStartTime)

        return executionState
            .upsertStep(action.name, failedStepOutput)
            .setVerdict({
                status: FlowRunStatus.FAILED, failedStep: {
                    name: action.name,
                    displayName: action.displayName,
                    message: utils.formatError(executionStateError),
                },
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

function createPauseHook(params: CreatePauseHookParams, pauseId: string, requestIdToReply: string | null): PauseHook {
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
                        pauseMetadata: {
                            ...req.pauseMetadata,
                            requestIdToReply: requestIdToReply ?? undefined,
                        },
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
                            requestIdToReply: requestIdToReply ?? undefined,
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
