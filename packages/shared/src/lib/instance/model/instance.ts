import { BaseModel } from "../../common/base-model";
import { FlowVersionId } from "../../flows/flow-version";
import { ProjectId } from "../../project/project";
import { ApId } from "../../common/id-generator";
import { FlowId } from "../../flows/flow";

export type InstanceId = ApId;

export interface Instance extends BaseModel<InstanceId> {
    projectId: ProjectId;
    flowIdToVersionId: Record<FlowId, FlowVersionId>;
    status: InstanceStatus;
}

export enum InstanceStatus {
    ENABLED = "ENABLED",
    DISABLED = "DISABLED",
}