import { FlowVersionTemplate, Metadata, Nullable, TemplateType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const CreateFlowTemplateRequest = Type.Object({
    description: Type.Optional(Type.String()),
    template: FlowVersionTemplate,
    blogUrl: Type.Optional(Type.String()),
    type: Type.Enum(TemplateType),
    tags: Type.Optional(Type.Array(Type.String())),
    id: Type.Optional(Type.String()),
    metadata: Nullable(Metadata),
})

export type CreateFlowTemplateRequest = Static<typeof CreateFlowTemplateRequest>
