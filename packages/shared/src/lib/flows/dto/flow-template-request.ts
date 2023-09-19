import { Static, Type } from "@sinclair/typebox";
import { FlowVersion } from "../flow-version";
import { UserMeta } from "../../user/user";
import { BaseModelSchema } from "../../common";
export const FlowVersionTemplate = Type.Omit(
    FlowVersion,
    ["id", "created", "updated", "flowId", "state", "updatedBy"]
);

export type FlowVersionTemplate = Static<typeof FlowVersionTemplate>;

export const FlowTemplate = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    description: Type.String(),
    tags: Type.Array(Type.String()),
    pieces: Type.Array(Type.String()),
    blogUrl: Type.Optional(Type.String()),
    template: FlowVersionTemplate,
    userId: Type.Union([Type.Null(), Type.String()]),
    user: Type.Optional(Type.Partial(UserMeta)),
    imageUrl: Type.Union([Type.Null(), Type.String()]),
    featuredDescription:Type.Optional(Type.String()),
    isFeatured:Type.Optional( Type.Boolean())
})

export type FlowTemplate = Static<typeof FlowTemplate>


export const ListFlowTemplatesRequest = Type.Object({
    pieces: Type.Optional(Type.Array(Type.String())),
    tags: Type.Optional(Type.Array(Type.String())),
    search: Type.Optional(Type.String()),
    featuredOnly: Type.Optional(Type.Boolean())
})

export type ListFlowTemplatesRequest = Static<typeof ListFlowTemplatesRequest>