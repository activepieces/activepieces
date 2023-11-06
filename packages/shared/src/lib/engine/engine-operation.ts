import { AppConnectionValue } from "../app-connection/app-connection";
import { ResumeStepMetadata } from "../flow-run/execution/execution-output";
import { ExecutionState } from "../flow-run/execution/execution-state";
import { ExecutionType } from "../flow-run/execution/execution-type";
import { FlowRunId } from "../flow-run/flow-run";
import { CodeAction } from "../flows/actions/action";
import { FlowVersion } from "../flows/flow-version";
import { ProjectId } from "../project/project";
import { PiecePackage } from "../pieces";

export enum EngineOperationType {
    EXTRACT_PIECE_METADATA = "EXTRACT_PIECE_METADATA",
    EXECUTE_ACTION = "EXECUTE_ACTION",
    EXECUTE_CODE = "EXECUTE_CODE",
    EXECUTE_FLOW = "EXECUTE_FLOW",
    EXECUTE_PROPERTY = "EXECUTE_PROPERTY",
    EXECUTE_TRIGGER_HOOK = "EXECUTE_TRIGGER_HOOK",
    EXECUTE_VALIDATE_AUTH = "EXECUTE_VALIDATE_AUTH",
    EXECUTE_TEST = "EXECUTE_TEST",
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
    | ExecuteValidateAuthOperation

type BaseEngineOperation = {
    projectId: ProjectId
    workerToken?: string
    serverUrl: string,
}

export type ExecuteActionOperation = BaseEngineOperation & {
    piece: PiecePackage
    actionName: string
    flowVersion: FlowVersion
    serverUrl: string,
    input: Record<string, unknown>
}

export type ExecuteValidateAuthOperation = BaseEngineOperation & {
    piece: PiecePackage
    auth: AppConnectionValue
}

export type ExecuteExtractPieceMetadata = PiecePackage

export type ExecuteCodeOperation = {
    step: CodeAction
    serverUrl: string
    flowVersion: FlowVersion,
    input: Record<string, unknown>
    projectId: ProjectId
}

export type ExecutePropsOptions = BaseEngineOperation & {
    piece: PiecePackage
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

export type BeginExecuteFlowOperation = BaseExecuteFlowOperation<ExecutionType.BEGIN> & {
    executionState?: ExecutionState,
}

export type ResumeExecuteFlowOperation = BaseExecuteFlowOperation<ExecutionType.RESUME> & {
    executionState: ExecutionState,
    resumeStepMetadata: ResumeStepMetadata,
    resumePayload: unknown,
}

export type ExecuteFlowOperation = BeginExecuteFlowOperation | ResumeExecuteFlowOperation

export type EngineTestOperation = BeginExecuteFlowOperation & {
    /**
     * original flow version that the current test flow version is derived from.
     * Used to generate the test execution context.
     */
    sourceFlowVersion: FlowVersion
}

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
