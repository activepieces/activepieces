import { BaseModel } from "../../common/base-model";
import { CollectionId } from "../../collections/collection";
import { FlowVersionId } from "../../flows/flow-version";
import { ProjectId } from "../../project/project";
import { ApId } from "../../common/id-generator";
import { FlowId } from "../../flows/flow";

export type InstanceId = ApId;

export interface Instance extends BaseModel<InstanceId> {
    projectId: ProjectId;
    collectionId: CollectionId;
    flowIdToVersionId: Record<FlowId, FlowVersionId>;
    status: InstanceStatus;
}

export enum InstanceStatus {
    ENABLED = "ENABLED",
    DISABLED = "DISABLED",
}
