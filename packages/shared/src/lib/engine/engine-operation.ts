import { FlowVersion, FlowVersionId } from "../flows/flow-version";
import { ProjectId } from "../project/project";

export enum EngineOperationType {
    EXECUTE_ACTION = "EXECUTE_ACTION",
    EXECUTE_FLOW = "EXECUTE_FLOW",
    EXECUTE_PROPERTY = "EXECUTE_PROPERTY",
    EXECUTE_TRIGGER_HOOK = "EXECUTE_TRIGGER_HOOK"
}

export enum TriggerHookType {
    ON_ENABLE = "ON_ENABLE",
    ON_DISABLE = "ON_DISABLE",
    RUN = "RUN",
    TEST = "TEST",
}

export type EngineOperation =
    | ExecuteActionOperation
    | ExecuteFlowOperation
    | ExecutePropsOptions
    | ExecuteTriggerOperation<TriggerHookType>

export type ExecuteActionOperation = {
    actionName: string
    pieceName: string
    pieceVersion: string
    input: Record<string, unknown>
    testExecutionContext: Record<string, unknown>
    projectId: ProjectId
    workerToken?: string
    apiUrl?: string
}

export interface ExecutePropsOptions {
    pieceName: string;
    pieceVersion: string;
    propertyName: string;
    stepName: string;
    input: Record<string, any>;
    projectId: ProjectId;
    apiUrl?: string;
    workerToken?: string;
}

export interface ExecuteFlowOperation {
    flowVersionId: FlowVersionId,
    projectId: ProjectId,
    triggerPayload: unknown,
    workerToken?: string;
    apiUrl?: string;
}

export interface ExecuteTriggerOperation<HT extends TriggerHookType> {
    hookType: HT,
    flowVersion: FlowVersion,
    webhookUrl: string,
    triggerPayload?: TriggerPayload,
    projectId: ProjectId,
    workerToken?: string;
    apiUrl?: string;
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

interface ExecuteOnEnableTriggerResponse {
    listeners: AppEventListener[];
    scheduleOptions: ScheduleOptions;
}

export type ExecuteTriggerResponse<H extends TriggerHookType> = H extends TriggerHookType.RUN ? ExecuteTestOrRunTriggerResponse :
    H extends TriggerHookType.TEST ? ExecuteTestOrRunTriggerResponse :
    H extends TriggerHookType.ON_DISABLE ? Record<string, never> :
    ExecuteOnEnableTriggerResponse;

export type ExecuteActionResponse = {
    success: boolean;
    output: unknown;
    message?: string;
}

export interface ScheduleOptions {
    cronExpression: string;
    timezone?: string;
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