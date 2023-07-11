import { Static, Type } from "@sinclair/typebox";
import { FlowVersion } from "../flow-version";

export const FlowVersionTemplate = Type.Omit(
    FlowVersion,
    ["id", "created", "updated", "flowId", "state"]
);

export type FlowVersionTemplate = Static<typeof FlowVersionTemplate>;

export const FlowTemplate = Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.String(),
    tags: Type.Array(Type.String()),
    pieces: Type.Array(Type.String()),
    pinnedOrder: Type.Union([Type.Null(),Type.Number()]),
    blogUrl: Type.Optional(Type.String()),
    template: FlowVersionTemplate,
})

export type FlowTemplate = Static<typeof FlowTemplate>;


export const ListFlowTemplatesRequest = Type.Object({
    pieces: Type.Optional(Type.Array(Type.String())),
    tags: Type.Optional(Type.Array(Type.String())),
    search: Type.Optional(Type.String()),
    pinned:Type.Optional(Type.Boolean())
})

export type ListFlowTemplatesRequest = Static<typeof ListFlowTemplatesRequest>