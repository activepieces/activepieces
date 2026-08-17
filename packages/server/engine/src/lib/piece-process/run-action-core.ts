import { isNil } from '@activepieces/core-utils'
import { ActionContext, backwardCompatabilityContextUtils, CreateWaitpointHook, CreateWaitpointParams, CreateWaitpointResult, InputPropertyMap, PieceAuthProperty, RespondHook, RespondHookParams, StopHook, StopHookParams, TagsManager, WaitForWaitpointHook } from '@activepieces/pieces-framework'
import { AUTHENTICATION_PROPERTY_NAME, ExecutionType, PausedFlowTimeoutError } from '@activepieces/shared'
import dayjs from 'dayjs'
import { EngineConstants } from '../handler/context/engine-constants'
import { flowRunProgressReporter } from '../helper/flow-run-progress-reporter'
import { pieceLoader } from '../helper/piece-loader'
import { createFileUploader } from '../piece-context/file-uploader'
import { createFlowsContext } from '../piece-context/flows'
import { createContextStore } from '../piece-context/store'
import { waitpointClient } from '../piece-context/waitpoint-client'
import { HookResponse, utils } from '../utils'
import { propsProcessor } from '../variables/props-processor'
import { RunActionParams, RunActionResult } from './piece-process-types'

const AP_PAUSED_FLOW_TIMEOUT_DAYS = Number(process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS)

export async function runActionCore(request: RunActionParams): Promise<RunActionResult> {
    const { pieceName, pieceVersion, actionName, devPieces, constantsParams, resolvedInput, propertySettings, isPaused, testSingleStepMode } = request
    const constants = new EngineConstants(constantsParams)

    const { pieceAction, piece } = await pieceLoader.getPieceAndActionOrThrow({
        pieceName,
        pieceVersion,
        actionName,
        devPieces,
    })

    const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(resolvedInput, pieceAction.props, piece.auth, pieceAction.requireAuth, propertySettings)
    if (Object.keys(errors).length > 0) {
        throw new Error(JSON.stringify(errors, null, 2))
    }

    const params: { hookResponse: HookResponse } = {
        hookResponse: {
            type: 'none',
            tags: [],
        },
    }
    const outputContext = constants.actionRunMode
        ? { update: async (): Promise<void> => { /* no-op: action runs have no live progress channel */ } }
        : flowRunProgressReporter.createOutputContext({
            engineConstants: constants,
        })

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
            name: actionName,
        },
        auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
        files: createFileUploader({
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
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
            contextVersion: piece.getContextInfo?.().version,
            pieceName,
        }),
        run: {
            id: constants.flowRunId,
            stop: createStopHook(params),
            respond: createRespondHook(params),
            createWaitpoint: createWaitpointHook({ constants, stepName: actionName, hookParams: params }),
            waitForWaitpoint: createWaitForWaitpointHook({ constants, hookParams: params }),
        },
        project: {
            id: constants.projectId,
            externalId: constants.externalProjectId,
        },
    }
    const backwardCompatibleContext = backwardCompatabilityContextUtils.makeActionContextBackwardCompatible({
        contextVersion: piece.getContextInfo?.().version,
        context,
    })
    const runMethodToExecute = (testSingleStepMode && !isNil(pieceAction.test)) ? pieceAction.test : pieceAction.run
    const output = await runMethodToExecute(backwardCompatibleContext)

    return {
        output,
        hookResponse: params.hookResponse,
    }
}

const createTagsManager = (hkParams: CreateTagsManagerParams): TagsManager => {
    return {
        add: async (params: AddTagsParams): Promise<void> => {
            hkParams.hookResponse.tags.push(params.name)
        },
    }
}

function createStopHook(params: CreateHookParams): StopHook {
    return (req?: StopHookParams) => {
        params.hookResponse = {
            ...params.hookResponse,
            type: 'stopped',
            response: req ?? { response: {} },
        }
    }
}

function createRespondHook(params: CreateHookParams): RespondHook {
    return (req?: RespondHookParams) => {
        params.hookResponse = {
            ...params.hookResponse,
            type: 'respond',
            response: req ?? { response: {} },
        }
    }
}

function createWaitpointHook({ constants, stepName, hookParams }: { constants: EngineConstants, stepName: string, hookParams: { hookResponse: HookResponse } }): CreateWaitpointHook {
    return (req: CreateWaitpointParams): Promise<CreateWaitpointResult> => {
        assertActionRunCannotSuspend(constants)
        return submitWaitpoint({ constants, stepName, hookParams, req })
    }
}

async function submitWaitpoint({ constants, stepName, hookParams, req }: { constants: EngineConstants, stepName: string, hookParams: { hookResponse: HookResponse }, req: CreateWaitpointParams }): Promise<CreateWaitpointResult> {
    assertDelayWithinTimeout(req.resumeDateTime)
    if (!isNil(req.responseToSend)) {
        hookParams.hookResponse = { ...hookParams.hookResponse, responseToSend: req.responseToSend }
    }
    const result = await waitpointClient.create({
        apiUrl: constants.internalApiUrl,
        engineToken: constants.engineToken,
        flowRunId: constants.flowRunId,
        projectId: constants.projectId,
        stepName,
        type: req.type,
        version: req.version ?? 'V1',
        resumeDateTime: req.resumeDateTime,
        responseToSend: req.responseToSend,
        workerHandlerId: constants.workerHandlerId ?? undefined,
        httpRequestId: constants.httpRequestId ?? undefined,
    })
    return {
        ...result,
        buildResumeUrl: (params: { queryParams: Record<string, string>, sync?: boolean }): string => {
            const url = new URL(`${result.resumeUrl}${params.sync ? '/sync' : ''}`)
            url.search = new URLSearchParams(params.queryParams).toString()
            return url.toString()
        },
    }
}

function createWaitForWaitpointHook({ constants, hookParams }: { constants: EngineConstants, hookParams: { hookResponse: HookResponse } }): WaitForWaitpointHook {
    return (_waitpointId: string) => {
        assertActionRunCannotSuspend(constants)
        hookParams.hookResponse = {
            ...hookParams.hookResponse,
            type: 'paused',
        }
    }
}

function assertActionRunCannotSuspend(constants: EngineConstants): void {
    if (constants.actionRunMode) {
        throw new Error('This action pauses the run (waitpoint) and can only run inside a flow, not as a action run.')
    }
}

function assertDelayWithinTimeout(resumeDateTime?: string): void {
    if (isNil(resumeDateTime)) {
        return
    }
    const diffInDays = dayjs(resumeDateTime).diff(dayjs(), 'days')
    if (diffInDays > AP_PAUSED_FLOW_TIMEOUT_DAYS) {
        throw new PausedFlowTimeoutError(undefined, AP_PAUSED_FLOW_TIMEOUT_DAYS)
    }
}

type CreateHookParams = {
    hookResponse: HookResponse
}

type CreateTagsManagerParams = {
    hookResponse: HookResponse
}

type AddTagsParams = {
    name: string
}
