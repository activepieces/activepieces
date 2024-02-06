import { Static, Type } from "@sinclair/typebox"
import { FlowVersionTemplate, TemplateType } from "../flows/dto/flow-template-request"

export const CreateFlowTemplateRequest = Type.Object({
   description:  Type.Optional(Type.String()),
   template: FlowVersionTemplate,
   blogUrl: Type.Optional(Type.String()),
   type: Type.Enum(TemplateType),
   tags:  Type.Optional(Type.Array(Type.String())),
   id: Type.Optional(Type.String())
})

export type CreateFlowTemplateRequest = Static<typeof CreateFlowTemplateRequest>
