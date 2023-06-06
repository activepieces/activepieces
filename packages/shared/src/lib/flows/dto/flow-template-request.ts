import { Static, Type } from "@sinclair/typebox";
import { FlowVersion } from "../flow-version";

export const FlowTemplate = Type.Object({
    name: Type.String(),
    description: Type.String(),
    tags: Type.Array(Type.String()),
    pieces: Type.Array(Type.String()),
    pinned: Type.Boolean(),
    blogUrl: Type.Optional(Type.String()),
    template: Type.Unknown(),
})

export type FlowTemplate = Static<typeof FlowTemplate> & {template: FlowVersion}


export const ListFlowTemplatesRequest = Type.Object({
    pieces: Type.Optional(Type.Array(Type.String())),
    tags: Type.Optional(Type.Array(Type.String())),
    search: Type.Optional(Type.String()),
    pinned:Type.Optional(Type.Boolean())
})

export type ListFlowTemplatesRequest = Static<typeof ListFlowTemplatesRequest>