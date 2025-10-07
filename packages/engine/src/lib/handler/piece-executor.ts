import { URL } from 'url'
import { ActionContext, PauseHook, PauseHookParams, PiecePropertyMap, RespondHook, RespondHookParams, StaticPropsValue, StopHook, StopHookParams, TagsManager } from '@activepieces/pieces-framework'
import { ApEdition, assertNotNullOrUndefined, AUTHENTICATION_PROPERTY_NAME, ExecutionType, FlowActionType, FlowRunStatus, GenericStepOutput, isNil, PauseType, PieceAction, PropertyExecutionType, RespondResponse, StepOutputStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { continueIfFailureHandler, handleExecutionError, runWithExponentialBackoff } from '../helper/error-handling'
import { PausedFlowTimeoutError } from '../helper/execution-errors'
import { pieceLoader } from '../helper/piece-loader'
import { createFlowsContext } from '../services/flows.service'
import { progressService } from '../services/progress.service'
import { createFilesService } from '../services/step-files.service'
import { createContextStore } from '../services/storage.service'
import { toolInputsResolver } from '../services/tool-inputs-resolver'
import { HookResponse, utils } from '../utils'
import { propsProcessor } from '../variables/props-processor'
import { ActionHandler, BaseExecutor } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'

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

    try {
        assertNotNullOrUndefined(action.settings.actionName, 'actionName')
        const { pieceAction, piece } = await pieceLoader.getPieceAndActionOrThrow({
            pieceName: action.settings.pieceName,
            pieceVersion: action.settings.pieceVersion,
            actionName: action.settings.actionName,
            pieceSource: constants.piecesSource,
        })

        const { resolvedInput } = await constants.propsResolver.resolve<StaticPropsValue<PiecePropertyMap>>({
            unresolvedInput: action.settings.input,
            executionState,
        })

        const aiProcessedInput = await resolveInputsUsingAI({ resolvedInput, constants, action, executionState })

        const inputToProcess = {
            ...aiProcessedInput,
            ...(resolvedInput['auth'] ? { auth: resolvedInput['auth'] } : {}),
        }
        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(inputToProcess, pieceAction.props, piece.auth, pieceAction.requireAuth, action.settings.propertySettings)

        const { censoredInput: aiCensoredInput } = await constants.propsResolver.resolve<StaticPropsValue<PiecePropertyMap>>({
            unresolvedInput: aiProcessedInput,
            executionState,
        })

        stepOutput.input = aiCensoredInput
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
        const context: ActionContext = {
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
        const runMethodToExecute = (constants.testSingleStepMode && !isNil(pieceAction.test)) ? pieceAction.test : pieceAction.run
        const output = await runMethodToExecute(context)
        const newExecutionContext = executionState.addTags(params.hookResponse.tags)

        const webhookResponse = getResponse(params.hookResponse)
        const isSamePiece = constants.triggerPieceName === action.settings.pieceName
        if (!isNil(webhookResponse) && !isNil(constants.serverHandlerId) && !isNil(constants.httpRequestId) && isSamePiece) {
            await progressService.sendFlowResponse(constants, {
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
            assertNotNullOrUndefined(params.hookResponse.response, 'stopResponse')
            return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(stepEndTime - stepStartTime)).setVerdict(ExecutionVerdict.SUCCEEDED, {
                reason: FlowRunStatus.SUCCEEDED,
                stopResponse: (params.hookResponse.response as StopHookParams).response,
            }).increaseTask()
        }
        if (params.hookResponse.type === 'paused') {
            assertNotNullOrUndefined(params.hookResponse.response, 'pauseResponse')
            return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.PAUSED).setDuration(stepEndTime - stepStartTime))
                .setVerdict(ExecutionVerdict.PAUSED, {
                    reason: FlowRunStatus.PAUSED,
                    pauseMetadata: (params.hookResponse.response as PauseHookParams).pauseMetadata,
                })
        }
        return newExecutionContext.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(stepEndTime - stepStartTime)).increaseTask().setVerdict(ExecutionVerdict.RUNNING, undefined)
    }
    catch (e) {
        const handledError = handleExecutionError(e)

        const failedStepOutput = stepOutput
            .setStatus(StepOutputStatus.FAILED)
            .setErrorMessage(handledError.message)
            .setDuration(performance.now() - stepStartTime)

        return executionState
            .upsertStep(action.name, failedStepOutput)
            .setVerdict(ExecutionVerdict.FAILED, handledError.verdictResponse)
            .increaseTask()
    }
}

async function resolveInputsUsingAI({ resolvedInput, constants, action, executionState }: ResolveInputsUsingAIParams) {
    if (constants.edition === ApEdition.COMMUNITY) {
        return resolvedInput
    }
    const preDefinedInputs: Record<string, unknown> = {
        ...resolvedInput,
        ...(action.settings.input['auth'] ? { auth: action.settings.input['auth'] } : {}),
        previousStepsResults: executionState.steps,
    }
    Object.entries(action.settings.propertySettings ?? {}).forEach(([key, value]) => {
        if (value.type === PropertyExecutionType.AUTO) {
            preDefinedInputs[key] = undefined
        }
    })
    assertNotNullOrUndefined(action.settings.actionName, 'actionName')
    const aiResolvedInput = await toolInputsResolver.resolve(constants, {
        pieceName: action.settings.pieceName,
        pieceVersion: action.settings.pieceVersion,
        actionName: action.settings.actionName,
        preDefinedInputs,
        flowVersionId: constants.flowVersionId,
    })
    if (isNil(aiResolvedInput)) {
        return resolvedInput
    }
    aiResolvedInput['previousStepsResults'] = undefined
    return aiResolvedInput
    
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

type ResolveInputsUsingAIParams = {
    resolvedInput: StaticPropsValue<PiecePropertyMap>
    constants: EngineConstants
    action: PieceAction
    executionState: FlowExecutorContext
}