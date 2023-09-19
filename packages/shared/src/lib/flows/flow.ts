import { BaseModelSchema } from "../common/base-model";
import { ApId } from "../common/id-generator";
import { FlowVersion } from "./flow-version";
import { FlowInstanceStatus, FlowScheduleOptions } from "./flow-instances";
import { Type, Static } from "@sinclair/typebox";

export type FlowId = ApId;


export const Flow = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    folderId: Type.Union([Type.String(),Type.Null()]),
    version: FlowVersion,
    // TODO revisit this area as these filled from Instance during listing.
    status: Type.Enum(FlowInstanceStatus),
    schedule: FlowScheduleOptions
})

export type Flow = Static<typeof Flow>;