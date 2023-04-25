import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";
import {FlowVersion} from "./flow-version";
import { ProjectId } from "../project/project";
import { FolderId } from "./folders/folder";
import { FlowInstanceStatus } from "./flow-instances";

export type FlowId = ApId;

export interface Flow extends BaseModel<FlowId> {
    projectId: ProjectId;
    folderId?: FolderId | null;
    version: FlowVersion;
    status: FlowInstanceStatus
}

