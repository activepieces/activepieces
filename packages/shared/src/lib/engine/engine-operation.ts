import { ResumeStepMetadata } from "../flow-run/execution/execution-output";
import { ExecutionState } from "../flow-run/execution/execution-state";
import { ExecutionType } from "../flow-run/execution/execution-type";
import { FlowRunId } from "../flow-run/flow-run";
import { FlowVersion } from "../flows/flow-version";
import { ProjectId } from "../project/project";

export enum EngineOperationType {
    EXTRACT_PIECE_METADATA = "EXTRACT_PIECE_METADATA",
    EXECUTE_ACTION = "EXECUTE_ACTION",
    EXECUTE_CODE = "EXECUTE_CODE",
    EXECUTE_FLOW = "EXECUTE_FLOW",
    EXECUTE_PROPERTY = "EXECUTE_PROPERTY",
    EXECUTE_TRIGGER_HOOK = "EXECUTE_TRIGGER_HOOK",
    EXECUTE_VALIDATE_AUTH = "EXECUTE_VALIDATE_AUTH",
}

export enum TriggerHookType {
    ON_ENABLE = "ON_ENABLE",
    ON_DISABLE = "ON_DISABLE",
    HANDSHAKE = "HANDSHAKE",
    RUN = "RUN",
    TEST = "TEST",
}

export type EngineOperation =
    | ExecuteActionOperation
    | ExecuteCodeOperation
    | ExecuteFlowOperation
    | ExecutePropsOptions
    | ExecuteTriggerOperation<TriggerHookType>
    | ExecuteExtractPieceMetadata

type BaseEngineOperation = {
    projectId: ProjectId
    workerToken?: string
    apiUrl?: string
}

export type ExecuteActionOperation = BaseEngineOperation & {
    actionName: string
    flowVersion: FlowVersion
    pieceName: string
    pieceVersion: string
    serverUrl: string,
    input: Record<string, unknown>
}

export type ExecuteValidateAuthOperation = BaseEngineOperation & {
    pieceName: string
    pieceVersion: string
    auth: unknown
}

export type ExecuteExtractPieceMetadata = {
    pieceName: string
    pieceVersion: string
}

export type ExecuteCodeOperation = {
    codeBase64: string
    flowVersion: FlowVersion,
    input: Record<string, unknown>
    projectId: ProjectId
}

export type ExecutePropsOptions = BaseEngineOperation & {
    pieceName: string;
    pieceVersion: string;
    propertyName: string;
    stepName: string;
    input: Record<string, any>;
}

type BaseExecuteFlowOperation<T extends ExecutionType> = BaseEngineOperation & {
    flowVersion: FlowVersion;
    flowRunId: FlowRunId;
    triggerPayload: unknown;
    serverUrl: string;
    executionType: T;
}

export type BeginExecuteFlowOperation = BaseExecuteFlowOperation<ExecutionType.BEGIN>

export type ResumeExecuteFlowOperation = BaseExecuteFlowOperation<ExecutionType.RESUME> & {
    executionState: ExecutionState,
    resumeStepMetadata: ResumeStepMetadata,
    resumePayload: unknown,
}

export type ExecuteFlowOperation = BeginExecuteFlowOperation | ResumeExecuteFlowOperation

export type ExecuteTriggerOperation<HT extends TriggerHookType> = BaseEngineOperation & {
    hookType: HT,
    flowVersion: FlowVersion,
    webhookUrl: string,
    triggerPayload?: TriggerPayload,
    edition?: string;
    appWebhookUrl?: string;
    webhookSecret?: string;
}

export type TriggerPayload = Record<string, never> | {
    body: any,
    headers: Record<string, string>,
    queryParams: Record<string, string>,
}

export interface EventPayload {
    body: any,
    rawBody?: any;
    method: string,
    headers: Record<string, string>,
    queryParams: Record<string, string>,
}

export type ParseEventResponse = {
    event?: string;
    identifierValue?: string,
    reply?: {
        headers: Record<string, string>,
        body: unknown
    }
}

export interface AppEventListener {
    events: string[],
    identifierValue: string,
};


interface ExecuteTestOrRunTriggerResponse {
    success: boolean;
    message?: string;
    output: unknown[];
}

interface ExecuteHandshakeTriggerResponse {
    success: boolean;
    message?: string;
    response?: {
        status: number,
        body?: any,
        headers?: Record<string, string>
    };
}

interface ExecuteOnEnableTriggerResponse {
    listeners: AppEventListener[];
    scheduleOptions?: ScheduleOptions;
}

export type ExecuteTriggerResponse<H extends TriggerHookType> = H extends TriggerHookType.RUN ? ExecuteTestOrRunTriggerResponse :
    H extends TriggerHookType.HANDSHAKE ? ExecuteHandshakeTriggerResponse :
    H extends TriggerHookType.TEST ? ExecuteTestOrRunTriggerResponse :
    H extends TriggerHookType.ON_DISABLE ? Record<string, never> :
    ExecuteOnEnableTriggerResponse;

export type ExecuteActionResponse = {
    success: boolean;
    output: unknown;
    message?: string;
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

export interface ScheduleOptions {
    cronExpression: string;
    timezone: string;
}

export type EngineResponse<T> = {
    status: EngineResponseStatus
    response: T
}

export enum EngineResponseStatus {
    OK = "OK",
    ERROR = "ERROR",
    TIMEOUT = "TIMEOUT"
}
