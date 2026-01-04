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

export const CATEGORY_DISPLAY_NAMES: Record<TemplateCategory, string> = {
    [TemplateCategory.ANALYTICS]: 'Analytics',
    [TemplateCategory.COMMUNICATION]: 'Communication',
    [TemplateCategory.CONTENT]: 'Content',
    [TemplateCategory.CUSTOMER_SUPPORT]: 'Customer Support',
    [TemplateCategory.DEVELOPMENT]: 'Development',
    [TemplateCategory.E_COMMERCE]: 'E-Commerce',
    [TemplateCategory.FINANCE]: 'Finance',
    [TemplateCategory.HR]: 'HR',
    [TemplateCategory.IT_OPERATIONS]: 'IT Operations',
    [TemplateCategory.MARKETING]: 'Marketing',
    [TemplateCategory.PRODUCTIVITY]: 'Productivity',
    [TemplateCategory.SALES]: 'Sales',
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
    categories: Type.Array(Type.Enum(TemplateCategory)),
    pieces: Type.Array(Type.String()),
    platformId: Nullable(Type.String()),
    flows: Type.Optional(Type.Array(FlowVersionTemplate)),
    status: Type.Enum(TemplateStatus),
})
export type Template = Static<typeof Template>

export const SharedTemplate = Omit(Template, ['platformId', 'id', 'created', 'updated', 'usageCount'])
export type SharedTemplate = Static<typeof SharedTemplate>