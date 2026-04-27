import { z } from 'zod'
import { PlatformId } from '../../management/platform'
import { ProjectId } from '../../management/project/project'
import { ExecutionToolStatus, PredefinedInputsStructure } from '../agents'
import { AppConnectionValue } from '../app-connection/app-connection'
import { ExecutionState, ExecutionType, ResumePayload } from '../flow-run/execution/execution-output'
import { FlowRunId, RunEnvironment } from '../flow-run/flow-run'
import { FlowVersion } from '../flows/flow-version'
import { PiecePackage } from '../pieces'
import { ScheduleOptions } from '../trigger'

export enum EngineOperationType {
    EXTRACT_PIECE_METADATA = 'EXTRACT_PIECE_METADATA',
    EXECUTE_FLOW = 'EXECUTE_FLOW',
    EXECUTE_PROPERTY = 'EXECUTE_PROPERTY',
    EXECUTE_TRIGGER_HOOK = 'EXECUTE_TRIGGER_HOOK',
    EXECUTE_VALIDATE_AUTH = 'EXECUTE_VALIDATE_AUTH',
}

export enum TriggerHookType {
    ON_ENABLE = 'ON_ENABLE',
    ON_DISABLE = 'ON_DISABLE',
    HANDSHAKE = 'HANDSHAKE',
    RENEW = 'RENEW',
    RUN = 'RUN',
    TEST = 'TEST',
}

export type EngineOperation =
    | ExecuteToolOperation
    | ExecuteFlowOperation
    | ExecutePropsOptions
    | ExecuteTriggerOperation<TriggerHookType>
    | ExecuteExtractPieceMetadataOperation
    | ExecuteValidateAuthOperation


export const EngineStdout = z.object({
    message: z.string(),
})

export const EngineStderr = z.object({
    message: z.string(),
})


export type EngineStdout = z.infer<typeof EngineStdout>
export type EngineStderr = z.infer<typeof EngineStderr>


export type BaseEngineOperation = {
    projectId: ProjectId
    engineToken: string
    internalApiUrl: string
    publicApiUrl: string
    timeoutInSeconds: number
    platformId: PlatformId
}

export type ExecuteValidateAuthOperation = Omit<BaseEngineOperation, 'projectId'> & {
    piece: PiecePackage
    auth: AppConnectionValue
}

export type ExecuteExtractPieceMetadata = PiecePackage & { platformId: PlatformId }

export type ExecuteExtractPieceMetadataOperation = ExecuteExtractPieceMetadata & { timeoutInSeconds: number, platformId: PlatformId }

export type ExecuteToolOperation = BaseEngineOperation & {
    actionName: string
    pieceName: string
    pieceVersion: string
    predefinedInput?: PredefinedInputsStructure
    instruction: string
}

export type ExecutePropsOptions = BaseEngineOperation & {
    piece: PiecePackage
    propertyName: string
    actionOrTriggerName: string
    flowVersion?: FlowVersion
    input: Record<string, unknown>
    sampleData: Record<string, unknown>
    searchValue?: string
}

type BaseExecuteFlowOperation<T extends ExecutionType> = BaseEngineOperation & {
    flowVersion: FlowVersion
    flowRunId: FlowRunId
    executionType: T
    runEnvironment: RunEnvironment
    executionState: ExecutionState
    workerHandlerId: string | null
    httpRequestId: string | null
    streamStepProgress: StreamStepProgress
    stepNameToTest: string | null
    sampleData?: Record<string, unknown>
    logsUploadUrl?: string
    logsFileId?: string
}

export enum StreamStepProgress {
    WEBSOCKET = 'WEBSOCKET',
    NONE = 'NONE',
}

export type BeginExecuteFlowOperation = BaseExecuteFlowOperation<ExecutionType.BEGIN> & {
    triggerPayload: unknown
    executeTrigger: boolean
}

export type ResumeExecuteFlowOperation = BaseExecuteFlowOperation<ExecutionType.RESUME> & {
    resumePayload: ResumePayload
}

export type ExecuteFlowOperation = BeginExecuteFlowOperation | ResumeExecuteFlowOperation


export type ExecuteTriggerOperation<HT extends TriggerHookType> = BaseEngineOperation & {
    hookType: HT
    test: boolean
    flowVersion: FlowVersion
    webhookUrl: string
    triggerPayload?: TriggerPayload
    appWebhookUrl?: string
    webhookSecret?: string | Record<string, string>
}


export const TriggerPayload = z.object({
    body: z.unknown(),
    rawBody: z.unknown().optional(),
    headers: z.record(z.string(), z.string()),
    queryParams: z.record(z.string(), z.string()),
})

export type TriggerPayload<T = unknown> = {
    body: T
    rawBody?: unknown
    headers: Record<string, string>
    queryParams: Record<string, string>
}

export type EventPayload<B = unknown> = {
    body: B
    rawBody?: unknown
    method: string
    headers: Record<string, string>
    queryParams: Record<string, string>
}

export type ParseEventResponse = {
    event?: string
    identifierValue?: string
    reply?: {
        headers: Record<string, string>
        body: unknown
    }
}

export type AppEventListener = {
    events: string[]
    identifierValue: string
}


type ExecuteTestOrRunTriggerResponse = {
    message?: string
    output: unknown[]
}

type ExecuteHandshakeTriggerResponse = {
    message?: string
    response?: {
        status: number
        body?: unknown
        headers?: Record<string, string>
    }
}

type ExecuteOnEnableTriggerResponse = {
    listeners: AppEventListener[]
    scheduleOptions?: ScheduleOptions
}

export const EngineHttpResponse = z.object({
    status: z.number(),
    body: z.unknown(),
    headers: z.record(z.string(), z.string()),
})

export type EngineHttpResponse = z.infer<typeof EngineHttpResponse>

export type ExecuteTriggerResponse<H extends TriggerHookType> = H extends TriggerHookType.RUN ? ExecuteTestOrRunTriggerResponse :
    H extends TriggerHookType.HANDSHAKE ? ExecuteHandshakeTriggerResponse :
        H extends TriggerHookType.TEST ? ExecuteTestOrRunTriggerResponse :
            H extends TriggerHookType.RENEW ? Record<string, never> :
                H extends TriggerHookType.ON_DISABLE ? Record<string, never> :
                    ExecuteOnEnableTriggerResponse

export type ExecuteToolResponse = {
    status: ExecutionToolStatus
    output?: unknown
    resolvedInput: Record<string, unknown>
    errorMessage?: unknown
}

export function normalizeToolOutputToExecuteResponse(
    raw: unknown,
): ExecuteToolResponse {
    if (raw === null || typeof raw !== 'object') {
        return {
            status: ExecutionToolStatus.FAILED,
            output: raw,
            resolvedInput: {},
            errorMessage: 'Invalid tool output',
        }
    }
    const o = raw as Record<string, unknown>
    if (
        o['status'] === ExecutionToolStatus.SUCCESS ||
        o['status'] === ExecutionToolStatus.FAILED
    ) {
        return {
            status: o['status'] as ExecutionToolStatus,
            output: o['output'],
            resolvedInput: (o['resolvedInput'] as Record<string, unknown>) ?? {},
            errorMessage: o['errorMessage'],
        }
    }
    const isError = o['isError'] === true
    let output: unknown = o['structuredContent']
    if (output === undefined && Array.isArray(o['content'])) {
        const parts = (o['content'] as { text?: string }[])
            .map((c) => c?.text)
            .filter(Boolean)
        output =
            parts.length === 1
                ? parts[0]
                : parts.length
                    ? { text: parts.join('') }
                    : o['content']
    }
    if (output === undefined) {
        output = o
    }
    return {
        status: isError ? ExecutionToolStatus.FAILED : ExecutionToolStatus.SUCCESS,
        output,
        resolvedInput: {},
        errorMessage: isError
            ? ((o['content'] as { text?: string }[])?.[0]?.text as string) ??
              (o['message'] as string) ??
              'Tool failed'
            : undefined,
    }
}

export type ExecuteActionResponse = {
    success: boolean
    input: unknown
    output: unknown
    message?: string
}

type BaseExecuteValidateAuthResponseOutput<Valid extends boolean> = {
    valid: Valid
}

type ValidExecuteValidateAuthResponseOutput = BaseExecuteValidateAuthResponseOutput<true>

type InvalidExecuteValidateAuthResponseOutput = BaseExecuteValidateAuthResponseOutput<false> & {
    error: string
}
export type ExecuteValidateAuthResponse =
    | ValidExecuteValidateAuthResponseOutput
    | InvalidExecuteValidateAuthResponseOutput


export type EngineResponse<T = unknown> = {
    status: EngineResponseStatus
    response: T
    error?: string
}

export enum EngineResponseStatus {
    OK = 'OK',
    USER_FAILURE = 'USER_FAILURE',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    TIMEOUT = 'TIMEOUT',
    MEMORY_ISSUE = 'MEMORY_ISSUE',
    LOG_SIZE_EXCEEDED = 'LOG_SIZE_EXCEEDED',
}
