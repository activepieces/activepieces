import {BaseModel} from "./base-model";
import KSUID = require("ksuid");
import {ProjectId} from "./project";
import {CollectionId} from "./collection";
import {FlowVersionId} from "./flow-version";
import {CollectionVersionId} from "./collection-version";
import {FileId} from "./file";

export type InstanceRunId = KSUID;

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