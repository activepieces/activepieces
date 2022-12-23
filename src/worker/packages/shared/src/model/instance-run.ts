import {BaseModel} from "./base-model";
import {ProjectId} from "./project";
import {FlowVersionId} from "./flow-version";
import {FileId} from "./file";
import {CollectionVersionId} from "../collection/collection-version";
import {CollectionId} from "../collection/collection";
import {ApId} from "../helper/id-generator";

export type InstanceRunId = ApId;

export interface InstanceRun extends BaseModel<InstanceRunId> {
    id: InstanceRunId,
    instanceId: InstanceRunId,
    projectId: ProjectId,
    collectionId: CollectionId,
    flowVersionId: FlowVersionId,
    collectionVersionId: CollectionVersionId,
    flowDisplayName: string;
    collectionDisplayName: string;
    logsFileId: FileId;
    status: FlowExecutionStatus;
    startTime: number;
    finishTime: number;
}

export enum FlowExecutionStatus{
    RUNNING = "RUNNING",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED"
}