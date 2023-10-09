import { Static, Type } from "@sinclair/typebox"

export const ShareFlowRequest = Type.Object({
   flowId: Type.String(),
   flowVersionId: Type.String(),
   description:  Type.Optional(Type.String()),
   featuredDescription:  Type.Optional(Type.String()),
   tags:  Type.Optional(Type.Array(Type.String())) ,
   blogUrl: Type.Optional(Type.String()),
   imageUrl: Type.Optional(Type.String()),
   isFeatured: Type.Optional(Type.Boolean())}
)

export type ShareFlowRequest = Static<typeof ShareFlowRequest>