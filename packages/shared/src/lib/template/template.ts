import { Omit, Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, ColorHex, Metadata, Nullable } from '../common'
import { FlowVersion } from '../flows/flow-version'

export const TemplateTag = Type.Object({
    title: Type.String(),
    color: ColorHex,
    icon: Type.Optional(Type.String()),
})
export type TemplateTag = Static<typeof TemplateTag>


export enum TemplateType {
    OFFICIAL = 'OFFICIAL',
    SHARED = 'SHARED',
    CUSTOM = 'CUSTOM',
}

export const FlowVersionTemplate = Type.Composite([Type.Omit(
    FlowVersion,
    ['id', 'created', 'updated', 'flowId', 'state', 'updatedBy', 'agentIds', 'connectionIds', 'backupFiles'],
), Type.Object({
    description: Type.Optional(Type.String()),
})])
export type FlowVersionTemplate = Static<typeof FlowVersionTemplate>

export enum TemplateStatus {
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export const Template = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    type: Type.Enum(TemplateType),
    summary: Type.String(),
    description: Type.String(),
    tags: Type.Array(TemplateTag),
    blogUrl: Nullable(Type.String()),
    metadata: Nullable(Metadata),
    usageCount: Type.Number(),
    author: Type.String(),
    categories: Type.Array(Type.String()),
    pieces: Type.Array(Type.String()),
    platformId: Nullable(Type.String()),
    flows: Type.Optional(Type.Array(FlowVersionTemplate)),
    status: Type.Enum(TemplateStatus),
})
export type Template = Static<typeof Template>

export const SharedTemplate = Omit(Template, ['platformId', 'id', 'created', 'updated', 'usageCount'])
export type SharedTemplate = Static<typeof SharedTemplate>