import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../../common";
import { ApId } from "../../common/id-generator";
import { ProjectId } from "../../project/project";
import { FlowId } from "../flow";
import { FlowVersionId } from "../flow-version";


export type FlowInstanceId = ApId;

export enum ScheduleType {
    CRON_EXPRESSION = 'CRON_EXPRESSION'
}

export enum FlowInstanceStatus {
    ENABLED = "ENABLED",
    DISABLED = "DISABLED",
    UNPUBLISHED = "UNPUBLISHED"
}

export const FlowScheduleOptions = Type.Optional(Type.Object({
    type: Type.Literal(ScheduleType.CRON_EXPRESSION),
    cronExpression: Type.String(),
    timezone: Type.String(),
}));

export type FlowScheduleOptions = Static<typeof FlowScheduleOptions>;

export const FlowInstance = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    flowId: Type.String(),
    flowVersionId: Type.String(),
    schedule: FlowScheduleOptions,
    status: Type.Enum(FlowInstanceStatus),
})

export type FlowInstance = Static<typeof FlowInstance> & {
    projectId: ProjectId;
    flowId: FlowId;
    flowVersionId: FlowVersionId;
};