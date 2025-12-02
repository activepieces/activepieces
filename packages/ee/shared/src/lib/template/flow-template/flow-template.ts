import { BaseModelSchema, FlowVersion, Nullable } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const FlowVersionTemplate = Type.Omit(
    FlowVersion,
    ['id', 'created', 'updated', 'flowId', 'state', 'updatedBy', 'agentIds', 'connectionIds', 'backupFiles'],
)
export type FlowVersionTemplate = Static<typeof FlowVersionTemplate>

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

export enum FlowTemplateScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export const FlowTemplate = Type.Object({
    ...BaseModelSchema,
    scope: Type.Enum(FlowTemplateScope),
    pieces: Type.Array(Type.String()),
    schemaVersion: Nullable(Type.String()),
    template: FlowVersionTemplate,
    projectId: Type.Optional(Type.String()),
    platformId: Type.String(),
})

export type FlowTemplate = Static<typeof FlowTemplate>

export const FlowTemplateWithoutProjectInformation = Type.Omit(FlowTemplate, ['projectId', 'platformId', 'id', 'scope'])
export type FlowTemplateWithoutProjectInformation = Static<typeof FlowTemplateWithoutProjectInformation>

