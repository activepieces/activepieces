import { Static, Type } from "@sinclair/typebox";
import { FlowId } from "../flow";
import { FlowInstanceStatus } from "./flow-instance";

export const GetFlowInstanceRequest = Type.Object({
    flowId: Type.String(),
});

export type GetFlowInstanceRequest = Static<typeof GetFlowInstanceRequest>;


export const UpsertFlowInstanceRequest = Type.Object({
    flowId: Type.String()
});

export type UpsertFlowInstanceRequest =
    Omit<Static<typeof UpsertFlowInstanceRequest>, "flowId">
    & {
        flowId: FlowId;
    };

export const UpdateFlowInstanceRequest = Type.Object({
    status: Type.Enum(FlowInstanceStatus),
});

export type UpdateFlowInstanceRequest = Static<typeof UpdateFlowInstanceRequest>;