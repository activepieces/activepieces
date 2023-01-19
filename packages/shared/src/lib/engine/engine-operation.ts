import { CollectionId } from "../collections/collection";
import { CollectionVersion, CollectionVersionId } from "../collections/collection-version";
import { FlowVersion, FlowVersionId } from "../flows/flow-version";
import { ProjectId } from "../project/project";

export enum EngineOperationType {
    EXECUTE_FLOW = "EXECEUTE_FLOW",
    DROPDOWN_OPTION = "DROPDOWN_OPTIONS",
    EXECUTE_TRIGGER_HOOK = "EXECUTE_TRIGGER_HOOK"
}

export enum TriggerHookType {
    ON_ENABLE = "ON_ENABLE",
    ON_DISABLE = "ON_DISABLE",
    RUN = "RUN"
}

export type EngineOperation = ExecuteFlowOperation | ExecuteDropdownOptions | ExecuteTriggerOperation;

export interface ExecuteDropdownOptions {
    pieceName: string;
    propertyName: string;
    stepName: string;
    input: Record<string, any>;
    collectionVersion: CollectionVersion;
    projectId: ProjectId;
    apiUrl?: string;
    workerToken?: string;
}

export interface ExecuteFlowOperation {
    flowVersionId: FlowVersionId,
    collectionId: CollectionId;
    collectionVersionId: CollectionVersionId,
    projectId: ProjectId,
    triggerPayload: unknown,
    workerToken?: string;
    apiUrl?: string;
}

export interface ExecuteTriggerOperation {
    hookType: TriggerHookType,
    flowVersion: FlowVersion,
    webhookUrl: string,
    collectionVersion: CollectionVersion;
    triggerPayload?: unknown,
    projectId: ProjectId,
    workerToken?: string;
    apiUrl?: string;
}
