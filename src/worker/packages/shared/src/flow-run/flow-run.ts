import {BaseModel} from "../common/base-model";
import {ProjectId} from "../project/project";
import {FlowVersionId} from "../flows/flow-version";
import {FileId} from "../file/file";
import {CollectionVersionId} from "../collections/collection-version";
import {CollectionId} from "../collections/collection";
import {ApId} from "../common/id-generator";
import { ExecutionOutputStatus } from "./execution/execution-output";
import { InstanceId } from "../instance/model";

export type FlowRunId = ApId;

export interface FlowRun extends BaseModel<FlowRunId> {
    id: FlowRunId,
    instanceId: InstanceId | null,
    projectId: ProjectId,
    collectionId: CollectionId,
    flowVersionId: FlowVersionId,
    collectionVersionId: CollectionVersionId,
    flowDisplayName: string;
    collectionDisplayName: string;
    logsFileId: FileId;
    status: ExecutionOutputStatus;
    startTime: string;
    finishTime: string;
}

