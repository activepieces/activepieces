import {BaseModel} from "../common/base-model";
import {ProjectId} from "../project/project";
import {FlowVersionId} from "../flows/flow-version";
import {FileId} from "../file/file";
import {CollectionVersionId} from "../collections/collection-version";
import {CollectionId} from "../collections/collection";
import {ApId} from "../common/id-generator";
import { ExecutionOutput, ExecutionOutputStatus } from "./execution/execution-output";
import { InstanceId } from "../instance/model";
import { ExecutionState } from "./execution/execution-state";
import { FlowId } from "../flows/flow";

export type FlowRunId = ApId;

export interface FlowRun extends BaseModel<FlowRunId> {
    id: FlowRunId,
    instanceId: InstanceId | null,
    projectId: ProjectId,
    flowId: FlowId,
    collectionId: CollectionId,
    flowVersionId: FlowVersionId,
    collectionVersionId: CollectionVersionId,
    flowDisplayName: string;
    collectionDisplayName: string;
    logsFileId: FileId;
    status: ExecutionOutputStatus;
    startTime: string;
    finishTime: string;

    // Frontend loads the state
    executionOutput?: ExecutionOutput;
}

