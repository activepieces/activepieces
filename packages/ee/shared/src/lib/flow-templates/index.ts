import { FlowVersionTemplate } from "@activepieces/shared"
import { Static, Type } from "@sinclair/typebox"

export const CreateFlowTemplateRequest = Type.Object({
   description:  Type.Optional(Type.String()),
   template: FlowVersionTemplate,
   featuredDescription:  Type.Optional(Type.String()),
   blogUrl: Type.Optional(Type.String()),
   imageUrl: Type.Optional(Type.String()),
   isFeatured: Type.Optional(Type.Boolean()),
   tags:  Type.Optional(Type.Array(Type.String())) ,
})

export type CreateFlowTemplateRequest = Static<typeof CreateFlowTemplateRequest>
