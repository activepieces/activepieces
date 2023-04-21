import { CollectionId } from "../collections/collection";
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
    | ExecuteTriggerOperation

export type ExecuteActionOperation = {
    actionName: string
    pieceName: string
    pieceVersion: string
    input: Record<string, unknown>
    testExecutionContext: Record<string, unknown>
    projectId: ProjectId
    collectionId: CollectionId
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
    collectionId: CollectionId,
    apiUrl?: string;
    workerToken?: string;
}

export interface ExecuteFlowOperation {
    flowVersionId: FlowVersionId,
    collectionId: CollectionId;
    projectId: ProjectId,
    triggerPayload: unknown,
    workerToken?: string;
    apiUrl?: string;
}

export interface ExecuteTriggerOperation {
    hookType: TriggerHookType,
    flowVersion: FlowVersion,
    webhookUrl: string,
    triggerPayload?: unknown,
    projectId: ProjectId,
    collectionId: CollectionId,
    workerToken?: string;
    apiUrl?: string;
    edition?: string;
    appWebhookUrl?: string;
    webhookSecret?: string;
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

export interface ExecuteTestOrRunTriggerResponse {
    success: boolean;
    message?: string;
    output: unknown[];
}

export interface ExecuteTriggerResponse {
    listeners: AppEventListener[];
    scheduleOptions: ScheduleOptions;
}

export interface ScheduleOptions {
    cronExpression: string;
    timezone?: string;
}
