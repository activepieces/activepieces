import {BaseModel} from "../common/base-model";
import {ProjectId} from "../project/project";
import {FlowVersionId} from "../flows/flow-version";
import {FileId} from "../file/file";
import {CollectionVersionId} from "../collections/collection-version";
import {CollectionId} from "../collections/collection";
import {ApId} from "../common/id-generator";

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