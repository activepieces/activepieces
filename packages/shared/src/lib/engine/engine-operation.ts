import { Static, Type } from '@sinclair/typebox'
import { AppConnectionValue } from '../app-connection/app-connection'
import { ExecutionState, ExecutionType, ResumePayload } from '../flow-run/execution/execution-output'
import { FlowRunId, RunEnvironment } from '../flow-run/flow-run'
import { FlowVersion } from '../flows/flow-version'
import { PiecePackage } from '../pieces'
import { PlatformId } from '../platform'
import { ProjectId } from '../project/project'
import { ScheduleOptions } from '../trigger'

export enum EngineOperationType {
    EXTRACT_PIECE_METADATA = 'EXTRACT_PIECE_METADATA',
    EXECUTE_TOOL = 'EXECUTE_TOOL',
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

export const enum EngineSocketEvent {
    ENGINE_RESPONSE = 'engine-response',
    ENGINE_STDOUT = 'engine-stdout',
    ENGINE_STDERR = 'engine-stderr',
    ENGINE_READY = 'engine-ready',
    ENGINE_OPERATION = 'engine-operation',
}


export const EngineStdout = Type.Object({
    message: Type.String(),
})

export const EngineStderr = Type.Object({
    message: Type.String(),
})


export type EngineStdout = Static<typeof EngineStdout>
export type EngineStderr = Static<typeof EngineStderr>


export type BaseEngineOperation = {
    projectId: ProjectId
    engineToken: string
    internalApiUrl: string
    publicApiUrl: string
    timeoutInSeconds: number
}

export type ExecuteValidateAuthOperation = Omit<BaseEngineOperation, 'projectId'> & {
    piece: PiecePackage
    platformId: PlatformId
    auth: AppConnectionValue
}

export type ExecuteExtractPieceMetadata = PiecePackage & { platformId: PlatformId }

export type ExecuteExtractPieceMetadataOperation = ExecuteExtractPieceMetadata & { timeoutInSeconds: number }

export type ExecuteToolOperation = BaseEngineOperation & {
    actionName: string
    pieceName: string
    pieceVersion: string
    input: Record<string, unknown>
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
    tasks: number
    runEnvironment: RunEnvironment
    executionState: ExecutionState
    serverHandlerId: string | null
    httpRequestId: string | null
    progressUpdateType: ProgressUpdateType
    stepNameToTest: string | null
    sampleData?: Record<string, unknown>
    logsUploadUrl?: string
    logsFileId?: string
}

export enum ProgressUpdateType {
    WEBHOOK_RESPONSE = 'WEBHOOK_RESPONSE',
    TEST_FLOW = 'TEST_FLOW',
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


export const TriggerPayload = Type.Object({
    body: Type.Unknown(),
    rawBody: Type.Optional(Type.Unknown()),
    headers: Type.Record(Type.String(), Type.String()),
    queryParams: Type.Record(Type.String(), Type.String()),
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
    success: boolean
    message?: string
    output: unknown[]
}

type ExecuteHandshakeTriggerResponse = {
    success: boolean
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

export const EngineHttpResponse = Type.Object({
    status: Type.Number(),
    body: Type.Unknown(),
    headers: Type.Record(Type.String(), Type.String()),
})

export type EngineHttpResponse = Static<typeof EngineHttpResponse>

export type ExecuteTriggerResponse<H extends TriggerHookType> = H extends TriggerHookType.RUN ? ExecuteTestOrRunTriggerResponse :
    H extends TriggerHookType.HANDSHAKE ? ExecuteHandshakeTriggerResponse :
        H extends TriggerHookType.TEST ? ExecuteTestOrRunTriggerResponse :
            H extends TriggerHookType.RENEW ? Record<string, never> :
                H extends TriggerHookType.ON_DISABLE ? Record<string, never> :
                    ExecuteOnEnableTriggerResponse

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
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    TIMEOUT = 'TIMEOUT',
    MEMORY_ISSUE = 'MEMORY_ISSUE',
}
