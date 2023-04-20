import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";
import {FlowVersion} from "./flow-version";
import { ProjectId } from "../project/project";
import { FolderId } from "./folders/folder";
import { FlowInstanceStatus } from "./flow-instances";

export type FlowId = ApId;

export interface Flow extends BaseModel<FlowId> {
    projectId: ProjectId;
    folderId?: FolderId;
    version: FlowVersion;
}

export interface FlowTableDto extends Flow {
    status: FlowInstanceStatus
}

export interface FlowBuilderDto extends Flow {
    folderDisplayName:string;
}