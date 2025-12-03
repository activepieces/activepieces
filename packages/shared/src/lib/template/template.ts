import { Omit, Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Metadata, Nullable } from '../common'
import { ColorName } from '../project'
import { Collection } from './collection'

export const TemplateTags = Type.Object({
    title: Type.String(),
    color: Type.Enum(ColorName),
    icon: Type.Optional(Type.String()),
})
export type TemplateTags = Static<typeof TemplateTags>

export enum TemplateType {
    OFFICIAL = 'OFFICIAL',
    SHARED = 'SHARED',
    CUSTOM = 'CUSTOM',
}

export enum TemplateCategory {
    ANALYTICS = 'ANALYTICS',
    COMMUNICATION = 'COMMUNICATION',
    CONTENT = 'CONTENT',
    CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
    DEVELOPMENT = 'DEVELOPMENT',
    E_COMMERCE = 'E_COMMERCE',
    FINANCE = 'FINANCE',
    HR = 'HR',
    IT_OPERATIONS = 'IT_OPERATIONS',
    MARKETING = 'MARKETING',
    PRODUCTIVITY = 'PRODUCTIVITY',
    SALES = 'SALES',
}

export const Template = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    type: Type.Enum(TemplateType),
    description: Type.String(),
    tags: Type.Array(TemplateTags),
    blogUrl: Nullable(Type.String()),
    metadata: Nullable(Metadata),
    usageCount: Type.Number(),
    author: Type.String(),
    categories: Type.Array(Type.Enum(TemplateCategory)),
    pieces: Type.Array(Type.String()),
    platformId: Nullable(Type.String()),
    collection: Collection,
})
export type Template = Static<typeof Template>

export const SharedTemplate = Omit(Template, ['platformId', 'id', 'created', 'updated', 'usageCount'])
export type SharedTemplate = Static<typeof SharedTemplate>