import { Static } from '@sinclair/typebox';
import { ExecutionToolStatus } from '../agents';
import { AppConnectionValue } from '../app-connection/app-connection';
import { ExecutionState, ExecutionType, ResumePayload } from '../flow-run/execution/execution-output';
import { FlowRunId, RunEnvironment } from '../flow-run/flow-run';
import { FlowVersion } from '../flows/flow-version';
import { PiecePackage } from '../pieces';
import { PlatformId } from '../platform';
import { ProjectId } from '../project/project';
import { ScheduleOptions } from '../trigger';
export declare enum EngineOperationType {
    EXTRACT_PIECE_METADATA = "EXTRACT_PIECE_METADATA",
    EXECUTE_FLOW = "EXECUTE_FLOW",
    EXECUTE_PROPERTY = "EXECUTE_PROPERTY",
    EXECUTE_TRIGGER_HOOK = "EXECUTE_TRIGGER_HOOK",
    EXECUTE_VALIDATE_AUTH = "EXECUTE_VALIDATE_AUTH"
}
export declare enum TriggerHookType {
    ON_ENABLE = "ON_ENABLE",
    ON_DISABLE = "ON_DISABLE",
    HANDSHAKE = "HANDSHAKE",
    RENEW = "RENEW",
    RUN = "RUN",
    TEST = "TEST"
}
export type EngineOperation = ExecuteToolOperation | ExecuteFlowOperation | ExecutePropsOptions | ExecuteTriggerOperation<TriggerHookType> | ExecuteExtractPieceMetadataOperation | ExecuteValidateAuthOperation;
export declare const enum EngineSocketEvent {
    ENGINE_RESPONSE = "engine-response",
    ENGINE_STDOUT = "engine-stdout",
    ENGINE_STDERR = "engine-stderr",
    ENGINE_READY = "engine-ready",
    ENGINE_OPERATION = "engine-operation",
    UPDATE_RUN_PROGRESS = "update-run-progress",
    SEND_FLOW_RESPONSE = "send-flow-response",
    UPDATE_STEP_PROGRESS = "update-step-progress"
}
export declare const EngineStdout: import("@sinclair/typebox").TObject<{
    message: import("@sinclair/typebox").TString;
}>;
export declare const EngineStderr: import("@sinclair/typebox").TObject<{
    message: import("@sinclair/typebox").TString;
}>;
export type EngineStdout = Static<typeof EngineStdout>;
export type EngineStderr = Static<typeof EngineStderr>;
export type BaseEngineOperation = {
    projectId: ProjectId;
    engineToken: string;
    internalApiUrl: string;
    publicApiUrl: string;
    timeoutInSeconds: number;
    platformId: PlatformId;
};
export type ExecuteValidateAuthOperation = Omit<BaseEngineOperation, 'projectId'> & {
    piece: PiecePackage;
    auth: AppConnectionValue;
};
export type ExecuteExtractPieceMetadata = PiecePackage & {
    platformId: PlatformId;
};
export type ExecuteExtractPieceMetadataOperation = ExecuteExtractPieceMetadata & {
    timeoutInSeconds: number;
    platformId: PlatformId;
};
export type ExecuteToolOperation = BaseEngineOperation & {
    actionName: string;
    pieceName: string;
    pieceVersion: string;
    predefinedInput: Record<string, unknown>;
    instruction: string;
};
export type ExecutePropsOptions = BaseEngineOperation & {
    piece: PiecePackage;
    propertyName: string;
    actionOrTriggerName: string;
    flowVersion?: FlowVersion;
    input: Record<string, unknown>;
    sampleData: Record<string, unknown>;
    searchValue?: string;
};
type BaseExecuteFlowOperation<T extends ExecutionType> = BaseEngineOperation & {
    flowVersion: FlowVersion;
    flowRunId: FlowRunId;
    executionType: T;
    runEnvironment: RunEnvironment;
    executionState: ExecutionState;
    serverHandlerId: string | null;
    httpRequestId: string | null;
    progressUpdateType: ProgressUpdateType;
    stepNameToTest: string | null;
    sampleData?: Record<string, unknown>;
    logsUploadUrl?: string;
    logsFileId?: string;
};
export declare enum ProgressUpdateType {
    WEBHOOK_RESPONSE = "WEBHOOK_RESPONSE",
    TEST_FLOW = "TEST_FLOW",
    NONE = "NONE"
}
export type BeginExecuteFlowOperation = BaseExecuteFlowOperation<ExecutionType.BEGIN> & {
    triggerPayload: unknown;
    executeTrigger: boolean;
};
export type ResumeExecuteFlowOperation = BaseExecuteFlowOperation<ExecutionType.RESUME> & {
    resumePayload: ResumePayload;
};
export type ExecuteFlowOperation = BeginExecuteFlowOperation | ResumeExecuteFlowOperation;
export type ExecuteTriggerOperation<HT extends TriggerHookType> = BaseEngineOperation & {
    hookType: HT;
    test: boolean;
    flowVersion: FlowVersion;
    webhookUrl: string;
    triggerPayload?: TriggerPayload;
    appWebhookUrl?: string;
    webhookSecret?: string | Record<string, string>;
};
export declare const TriggerPayload: import("@sinclair/typebox").TObject<{
    body: import("@sinclair/typebox").TUnknown;
    rawBody: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
    headers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
    queryParams: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
}>;
export type TriggerPayload<T = unknown> = {
    body: T;
    rawBody?: unknown;
    headers: Record<string, string>;
    queryParams: Record<string, string>;
};
export type EventPayload<B = unknown> = {
    body: B;
    rawBody?: unknown;
    method: string;
    headers: Record<string, string>;
    queryParams: Record<string, string>;
};
export type ParseEventResponse = {
    event?: string;
    identifierValue?: string;
    reply?: {
        headers: Record<string, string>;
        body: unknown;
    };
};
export type AppEventListener = {
    events: string[];
    identifierValue: string;
};
type ExecuteTestOrRunTriggerResponse = {
    success: boolean;
    message?: string;
    output: unknown[];
};
type ExecuteHandshakeTriggerResponse = {
    success: boolean;
    message?: string;
    response?: {
        status: number;
        body?: unknown;
        headers?: Record<string, string>;
    };
};
type ExecuteOnEnableTriggerResponse = {
    listeners: AppEventListener[];
    scheduleOptions?: ScheduleOptions;
};
export declare const EngineHttpResponse: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TNumber;
    body: import("@sinclair/typebox").TUnknown;
    headers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
}>;
export type EngineHttpResponse = Static<typeof EngineHttpResponse>;
export type ExecuteTriggerResponse<H extends TriggerHookType> = H extends TriggerHookType.RUN ? ExecuteTestOrRunTriggerResponse : H extends TriggerHookType.HANDSHAKE ? ExecuteHandshakeTriggerResponse : H extends TriggerHookType.TEST ? ExecuteTestOrRunTriggerResponse : H extends TriggerHookType.RENEW ? Record<string, never> : H extends TriggerHookType.ON_DISABLE ? Record<string, never> : ExecuteOnEnableTriggerResponse;
export type ExecuteToolResponse = {
    status: ExecutionToolStatus;
    output?: unknown;
    resolvedInput: Record<string, unknown>;
    errorMessage?: unknown;
};
export type ExecuteActionResponse = {
    success: boolean;
    input: unknown;
    output: unknown;
    message?: string;
};
type BaseExecuteValidateAuthResponseOutput<Valid extends boolean> = {
    valid: Valid;
};
type ValidExecuteValidateAuthResponseOutput = BaseExecuteValidateAuthResponseOutput<true>;
type InvalidExecuteValidateAuthResponseOutput = BaseExecuteValidateAuthResponseOutput<false> & {
    error: string;
};
export type ExecuteValidateAuthResponse = ValidExecuteValidateAuthResponseOutput | InvalidExecuteValidateAuthResponseOutput;
export type EngineResponse<T = unknown> = {
    status: EngineResponseStatus;
    response: T;
    delayInSeconds?: number;
    error?: string;
};
export declare enum EngineResponseStatus {
    OK = "OK",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    TIMEOUT = "TIMEOUT",
    MEMORY_ISSUE = "MEMORY_ISSUE"
}
export {};
