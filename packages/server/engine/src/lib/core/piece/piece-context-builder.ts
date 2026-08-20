import { isNil, isObject } from '@activepieces/core-utils'
import { ActionContext, backwardCompatabilityContextUtils, CreateWaitpointHook, CreateWaitpointParams, CreateWaitpointResult, InputPropertyMap, Piece, PieceAuthProperty, PiecePropertyMap, SetScheduleRequest, StaticPropsValue, StopHookParams, TagsManager } from '@activepieces/pieces-framework'
import { AUTHENTICATION_PROPERTY_NAME, EngineGenericError, InvalidCronExpressionError, InvalidScheduleIntervalError, PausedFlowTimeoutError, ScheduleOptions, TriggerSourceScheduleType } from '@activepieces/shared'
import { isValidCron } from 'cron-validator'
import dayjs from 'dayjs'
import { retryFetch } from '../../api/retry-fetch'
import { flowRunProgressReporter } from '../../helper/flow-run-progress-reporter'
import { createFileUploader } from '../../piece-context/file-uploader'
import { createFlowsContext } from '../../piece-context/flows'
import { createContextStore } from '../../piece-context/store'
import { waitpointClient } from '../../piece-context/waitpoint-client'
import { utils } from '../../utils'
import { propsProcessor } from '../../variables/props-processor'
import { ActionContextRequest, CollectedHooks, ContextRequest, PieceRuntime, PropsContextRequest, TriggerContextRequest } from './piece-protocol'

export async function buildContext({ piece, request }: BuildContextParams): Promise<BuiltContext> {
    const hooks: CollectedHooks = {
        hookResponse: { type: 'none', tags: [] },
        listeners: [],
    }
    const pending: Promise<unknown>[] = []
    switch (request.kind) {
        case 'action':
            return { args: [await buildActionContext({ piece, request, hooks, pending })], hooks, pending }
        case 'trigger':
            return { args: [await buildTriggerContext({ piece, request, hooks })], hooks, pending }
        case 'props':
            return { args: [request.resolvedInput, buildPropsContext(request)], hooks, pending }
    }
}

async function buildActionContext({ piece, request, hooks, pending }: ActionParams): Promise<unknown> {
    const { runtime, stepName, actionName } = request
    const action = piece.getAction(actionName)
    if (isNil(action)) {
        throw new EngineGenericError('ActionNotFoundError', `Action not found, actionName=${actionName}`)
    }
    const propsValue = await processProps({ request, props: action.props, requireAuth: action.requireAuth, piece })

    const context: ActionContext<PieceAuthProperty, InputPropertyMap> = {
        executionType: request.executionType,
        resumePayload: request.resumePayload!,
        store: createContextStore({
            apiUrl: runtime.internalApiUrl,
            prefix: '',
            flowId: runtime.flowId,
            engineToken: runtime.engineToken,
        }),
        output: runtime.actionRunMode
            ? { update: async (): Promise<void> => Promise.resolve() }
            : flowRunProgressReporter.createOutputContext(runtime),
        flows: createFlowsContext({
            engineToken: runtime.engineToken,
            internalApiUrl: runtime.internalApiUrl,
            flowId: runtime.flowId,
            flowVersionId: runtime.flowVersionId,
        }),
        step: { name: stepName },
        auth: propsValue[AUTHENTICATION_PROPERTY_NAME],
        files: createFileUploader({ apiUrl: runtime.internalApiUrl, engineToken: runtime.engineToken }),
        server: {
            token: runtime.engineToken,
            apiUrl: runtime.internalApiUrl,
            publicUrl: runtime.publicApiUrl,
        },
        propsValue,
        tags: createTagsManager(hooks),
        connections: createConnections({ runtime, target: 'actions', hooks }),
        run: {
            id: runtime.flowRunId,
            stop: (request?: StopHookParams) => {
                hooks.hookResponse = { ...hooks.hookResponse, type: 'stopped', response: request ?? { response: {} } }
            },
            respond: (request?: StopHookParams) => {
                hooks.hookResponse = { ...hooks.hookResponse, type: 'respond', response: request ?? { response: {} } }
            },
            createWaitpoint: createWaitpointHook({ runtime, stepName, hooks, pending }),
            waitForWaitpoint: () => {
                assertCanSuspend(runtime)
                hooks.hookResponse = { ...hooks.hookResponse, type: 'paused' }
            },
        },
        project: createProjectContext(runtime),
    }

    return backwardCompatabilityContextUtils.makeActionContextBackwardCompatible({
        contextVersion: runtime.contextVersion,
        context,
    })
}

async function buildTriggerContext({ piece, request, hooks }: TriggerParams): Promise<unknown> {
    const { runtime, stepName } = request
    const trigger = piece.getTrigger(stepName)
    if (isNil(trigger)) {
        throw new EngineGenericError('TriggerNotFoundError', `Trigger not found, stepName=${stepName}`)
    }
    const propsValue = await processProps({ request, props: trigger.props, requireAuth: trigger.requireAuth, piece })

    return {
        store: createContextStore({
            apiUrl: runtime.internalApiUrl,
            prefix: request.storePrefix,
            flowId: runtime.flowId,
            engineToken: runtime.engineToken,
        }),
        step: { name: stepName },
        app: {
            createListeners: ({ events, identifierKey, identifierValue }: { events: string[], identifierKey: string, identifierValue: string }): void => {
                hooks.listeners.push({ events, identifierValue, identifierKey })
            },
        },
        setSchedule: (scheduleRequest: SetScheduleRequest) => {
            hooks.scheduleOptions = parseSchedule(scheduleRequest)
        },
        flows: createFlowsContext({
            engineToken: runtime.engineToken,
            internalApiUrl: runtime.internalApiUrl,
            flowId: runtime.flowId,
            flowVersionId: runtime.flowVersionId,
        }),
        webhookUrl: request.webhookUrl,
        isRepublish: request.isRepublish,
        auth: propsValue[AUTHENTICATION_PROPERTY_NAME],
        propsValue,
        payload: request.payload ?? {},
        run: { id: runtime.flowRunId },
        project: createProjectContext(runtime),
        server: {
            token: runtime.engineToken,
            apiUrl: runtime.internalApiUrl,
            publicUrl: runtime.publicApiUrl,
        },
        connections: createConnections({ runtime, target: 'triggers', hooks }),
        ...(request.includeFiles ? { files: createFileUploader({ apiUrl: runtime.internalApiUrl, engineToken: runtime.engineToken }) } : {}),
    }
}

function buildPropsContext({ runtime, stepName, searchValue }: PropsContextRequest): unknown {
    return {
        searchValue,
        server: {
            token: runtime.engineToken,
            apiUrl: runtime.internalApiUrl,
            publicUrl: runtime.publicApiUrl,
        },
        project: createProjectContext(runtime),
        flows: createFlowsContext({
            engineToken: runtime.engineToken,
            internalApiUrl: runtime.internalApiUrl,
            flowId: runtime.flowId,
            flowVersionId: runtime.flowVersionId,
        }),
        step: { name: stepName },
        connections: createConnections({
            runtime,
            target: 'properties',
            hooks: { hookResponse: { type: 'none', tags: [] }, listeners: [] },
        }),
    }
}

async function processProps({ request, props, requireAuth, piece }: ProcessPropsParams): Promise<StaticPropsValue<PiecePropertyMap>> {
    const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
        request.resolvedInput,
        props,
        piece.auth,
        requireAuth,
        request.propertySettings,
    )
    if (Object.keys(errors).length > 0) {
        throw new Error(JSON.stringify(errors, null, 2))
    }
    return processedInput
}

function createConnections({ runtime, target, hooks }: { runtime: PieceRuntime, target: 'actions' | 'triggers' | 'properties', hooks: CollectedHooks }): ReturnType<typeof utils.createConnectionManager> {
    return utils.createConnectionManager({
        apiUrl: runtime.internalApiUrl,
        projectId: runtime.projectId,
        engineToken: runtime.engineToken,
        target,
        hookResponse: hooks.hookResponse,
        contextVersion: runtime.contextVersion,
        pieceName: runtime.pieceName,
    })
}

function createProjectContext(runtime: PieceRuntime): { id: string, externalId: () => Promise<string | undefined> } {
    return {
        id: runtime.projectId,
        externalId: async () => {
            const response = await retryFetch(`${runtime.internalApiUrl}v1/worker/project`, {
                headers: { Authorization: `Bearer ${runtime.engineToken}` },
            })
            const project = await response.json()
            return isObject(project) && typeof project.externalId === 'string' ? project.externalId : undefined
        },
    }
}

function createTagsManager(hooks: CollectedHooks): TagsManager {
    return {
        add: async ({ name }: { name: string }): Promise<void> => {
            hooks.hookResponse.tags.push(name)
        },
    }
}

function createWaitpointHook({ runtime, stepName, hooks, pending }: WaitpointHookParams): CreateWaitpointHook {
    return (params: CreateWaitpointParams) => {
        const created = createWaitpoint({ runtime, stepName, hooks, params })
        pending.push(created)
        return created
    }
}

async function createWaitpoint({ runtime, stepName, hooks, params }: SubmitWaitpointParams): Promise<CreateWaitpointResult> {
    assertCanSuspend(runtime)
    assertDelayWithinTimeout(params.resumeDateTime)
    if (!isNil(params.responseToSend)) {
        hooks.hookResponse = { ...hooks.hookResponse, responseToSend: params.responseToSend }
    }
    const result = await waitpointClient.create({
        apiUrl: runtime.internalApiUrl,
        engineToken: runtime.engineToken,
        flowRunId: runtime.flowRunId,
        projectId: runtime.projectId,
        stepName,
        type: params.type,
        version: params.version ?? 'V1',
        resumeDateTime: params.resumeDateTime,
        responseToSend: params.responseToSend,
        workerHandlerId: runtime.workerHandlerId,
        httpRequestId: runtime.httpRequestId,
    })
    return {
        ...result,
        buildResumeUrl: ({ queryParams, sync }) => {
            const url = new URL(`${result.resumeUrl}${sync ? '/sync' : ''}`)
            url.search = new URLSearchParams(queryParams).toString()
            return url.toString()
        },
    }
}

function parseSchedule(request: SetScheduleRequest): ScheduleOptions {
    if ('intervalMs' in request) {
        const parsed = ScheduleOptions.safeParse({ type: TriggerSourceScheduleType.INTERVAL, intervalMs: request.intervalMs })
        if (!parsed.success) {
            throw new InvalidScheduleIntervalError(request.intervalMs)
        }
        return parsed.data
    }
    if (!isValidCron(request.cronExpression)) {
        throw new InvalidCronExpressionError(request.cronExpression)
    }
    return {
        type: TriggerSourceScheduleType.CRON_EXPRESSION,
        cronExpression: request.cronExpression,
        timezone: request.timezone ?? 'UTC',
    }
}

function assertCanSuspend(runtime: PieceRuntime): void {
    if (runtime.actionRunMode) {
        throw new Error('This action pauses the run (waitpoint) and can only run inside a flow, not as a action run.')
    }
}

function assertDelayWithinTimeout(resumeDateTime?: string): void {
    if (isNil(resumeDateTime)) {
        return
    }
    if (dayjs(resumeDateTime).diff(dayjs(), 'days') > AP_PAUSED_FLOW_TIMEOUT_DAYS) {
        throw new PausedFlowTimeoutError(undefined, AP_PAUSED_FLOW_TIMEOUT_DAYS)
    }
}

const AP_PAUSED_FLOW_TIMEOUT_DAYS = Number(process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS)


type BuildContextParams = {
    piece: Piece
    request: ContextRequest
}

type ActionParams = {
    piece: Piece
    request: ActionContextRequest
    hooks: CollectedHooks
    pending: Promise<unknown>[]
}

type TriggerParams = {
    piece: Piece
    request: TriggerContextRequest
    hooks: CollectedHooks
}

type ProcessPropsParams = {
    request: ActionContextRequest | TriggerContextRequest
    props: Parameters<typeof propsProcessor.applyProcessorsAndValidators>[1]
    requireAuth: boolean
    piece: Piece
}

type WaitpointHookParams = {
    runtime: PieceRuntime
    stepName: string
    hooks: CollectedHooks
    pending: Promise<unknown>[]
}

type SubmitWaitpointParams = {
    runtime: PieceRuntime
    stepName: string
    hooks: CollectedHooks
    params: CreateWaitpointParams
}

export type BuiltContext = {
    args: unknown[]
    hooks: CollectedHooks
    pending: Promise<unknown>[]
}
