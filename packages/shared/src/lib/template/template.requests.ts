import { Static, Type } from '@sinclair/typebox'
import { Metadata, Nullable } from '../common'
import { Collection } from './collection'
import { TemplateCategory, TemplateTags, TemplateType } from './template'

export const CreateTemplateRequestBody = Type.Object({
    name: Type.String(),
    description: Type.String(),
    tags: Type.Optional(Type.Array(TemplateTags)),
    blogUrl: Type.Optional(Type.String()),
    metadata: Nullable(Metadata),
    author: Type.String(),
    categories: Type.Array(Type.Enum(TemplateCategory)),
    type: Type.Enum(TemplateType),
    collection: Collection,
})
export type CreateTemplateRequestBody = Static<typeof CreateTemplateRequestBody>

export const UpdateFlowTemplateRequestBody = Type.Object({
    name: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    tags: Type.Optional(Type.Array(TemplateTags)),
    blogUrl: Type.Optional(Type.String()),
    metadata: Nullable(Metadata),
    categories: Type.Optional(Type.Array(Type.Enum(TemplateCategory))),
    collection: Type.Optional(Collection),
})
export type UpdateFlowTemplateRequestBody = Static<typeof UpdateFlowTemplateRequestBody>

export const UpdateTemplateRequestBody = UpdateFlowTemplateRequestBody
export type UpdateTemplateRequestBody = Static<typeof UpdateTemplateRequestBody>

export const ListFlowTemplatesRequestQuery = Type.Object({
    type: Type.Enum(TemplateType),
    pieces: Type.Optional(Type.Array(Type.String())),
    tags: Type.Optional(Type.Array(Type.String())),
    search: Type.Optional(Type.String()),
})
export type ListFlowTemplatesRequestQuery = Static<typeof ListFlowTemplatesRequestQuery>


export const ListTemplatesRequestQuery = ListFlowTemplatesRequestQuery
export type ListTemplatesRequestQuery = Static<typeof ListTemplatesRequestQuery>