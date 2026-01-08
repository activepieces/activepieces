import { Static, Type } from '@sinclair/typebox'
import { Metadata, Nullable } from '../common'
import { FlowVersionTemplate, TemplateCategory, TemplateStatus, TemplateTag, TemplateType } from './template'

export const CreateTemplateRequestBody = Type.Object({
    name: Type.String(),
    summary: Type.String(),
    description: Type.String(),
    tags: Type.Optional(Type.Array(TemplateTag)),
    blogUrl: Type.Optional(Type.String()),
    metadata: Nullable(Metadata),
    author: Type.String(),
    categories: Type.Array(Type.Enum(TemplateCategory)),
    type: Type.Enum(TemplateType),
    flows: Type.Optional(Type.Array(FlowVersionTemplate)),
})
export type CreateTemplateRequestBody = Static<typeof CreateTemplateRequestBody>

export const UpdateFlowTemplateRequestBody = Type.Object({
    name: Type.Optional(Type.String()),
    summary: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    tags: Type.Optional(Type.Array(TemplateTag)),
    blogUrl: Type.Optional(Type.String()),
    metadata: Nullable(Metadata),
    status: Type.Optional(Type.Enum(TemplateStatus)),
    categories: Type.Optional(Type.Array(Type.Enum(TemplateCategory))),
    flows: Type.Optional(Type.Array(FlowVersionTemplate)),
})
export type UpdateFlowTemplateRequestBody = Static<typeof UpdateFlowTemplateRequestBody>

export const UpdateTemplateRequestBody = UpdateFlowTemplateRequestBody
export type UpdateTemplateRequestBody = Static<typeof UpdateTemplateRequestBody>

export const ListFlowTemplatesRequestQuery = Type.Object({
    type: Type.Optional(Type.Enum(TemplateType)),
    pieces: Type.Optional(Type.Array(Type.String())),
    tags: Type.Optional(Type.Array(TemplateTag)),
    search: Type.Optional(Type.String()),
    category: Type.Optional(Type.Enum(TemplateCategory)),
})
export type ListFlowTemplatesRequestQuery = Static<typeof ListFlowTemplatesRequestQuery>

export const ListTemplatesRequestQuery = ListFlowTemplatesRequestQuery
export type ListTemplatesRequestQuery = Static<typeof ListTemplatesRequestQuery>