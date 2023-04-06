import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../../common";
import { ApId } from "../../common/id-generator";
import { ProjectId } from "../../project/project";
import { FlowId } from "../flow";
import { FlowVersionId } from "../flow-version";

export type FlowInstanceId = ApId;

export enum FlowInstanceStatus {
    ENABLED = "ENABLED",
    DISABLED = "DISABLED",
}

export const FlowInstance = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    flowId: Type.String(),
    flowVersionId: Type.String(),
    status: Type.Enum(FlowInstanceStatus),
})

export type FlowInstance = Static<typeof FlowInstance> & {
    projectId: ProjectId;
    flowId: FlowId;
    flowVersionId: FlowVersionId;
};