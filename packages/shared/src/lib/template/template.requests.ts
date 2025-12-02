import { FlowTemplateScope, FlowVersionTemplate, TemplateCategory } from '@activepieces/ee-shared'
import { Static, Type } from '@sinclair/typebox'
import { TemplateTags } from './template'
import { Metadata, Nullable } from '../common'

const BaseTemplateRequestBody = {
    name: Type.String(),
    description: Type.String(),
    tags: Type.Optional(Type.Array(TemplateTags)),
    blogUrl: Type.Optional(Type.String()),
    metadata: Nullable(Metadata),
    author: Type.String(),
    categories: Type.Array(Type.Enum(TemplateCategory)),
}

export const CreateFlowTemplateRequestBody = Type.Object({
    projectId: Type.String(),
    template: FlowVersionTemplate,
    scope: Type.Enum(FlowTemplateScope),
    ...BaseTemplateRequestBody,
})

export const CreateTemplateRequestBody = CreateFlowTemplateRequestBody
export type CreateTemplateRequestBody = Static<typeof CreateTemplateRequestBody>

export const UpdateFlowTemplateRequestBody = Type.Object({
    name: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    tags: Type.Optional(Type.Array(TemplateTags)),
    blogUrl: Type.Optional(Type.String()),
    metadata: Nullable(Metadata),
    categories: Type.Optional(Type.Array(Type.Enum(TemplateCategory))),
    template: Type.Optional(FlowVersionTemplate),
})
export type UpdateFlowTemplateRequestBody = Static<typeof UpdateFlowTemplateRequestBody>

export const UpdateTemplateRequestBody = UpdateFlowTemplateRequestBody
export type UpdateTemplateRequestBody = Static<typeof UpdateTemplateRequestBody>

export const ListFlowTemplatesRequestQuery = Type.Object({
    pieces: Type.Optional(Type.Array(Type.String())),
    tags: Type.Optional(Type.Array(Type.String())),
    search: Type.Optional(Type.String()),
})
export type ListFlowTemplatesRequestQuery = Static<typeof ListFlowTemplatesRequestQuery>


export const ListTemplatesRequestQuery = ListFlowTemplatesRequestQuery
export type ListTemplatesRequestQuery = Static<typeof ListTemplatesRequestQuery>