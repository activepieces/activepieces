import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../../common'
import { FlowVersion } from '../flow-version'
export const FlowVersionTemplate = Type.Omit(
    FlowVersion,
    ['id', 'created', 'updated', 'flowId', 'state', 'updatedBy'],
)

export type FlowVersionTemplate = Static<typeof FlowVersionTemplate>


export enum TemplateType {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}
 
export const FlowTemplate = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    description: Type.String(),
    type: Type.Enum(TemplateType),
    tags: Type.Array(Type.String()),
    pieces: Type.Array(Type.String()),
    schemaVersion: Nullable(Type.String()),
    blogUrl: Type.Optional(Type.String()),
    template: FlowVersionTemplate,
    projectId: Type.Optional(Type.String()),
    platformId: Type.String(),
})

export type FlowTemplate = Static<typeof FlowTemplate>

export const FlowTemplateWithoutProjectInformation = Type.Omit(FlowTemplate, ['projectId', 'platformId', 'id', 'type'])
export type FlowTemplateWithoutProjectInformation = Static<typeof FlowTemplateWithoutProjectInformation>

export const ListFlowTemplatesRequest = Type.Object({
    pieces: Type.Optional(Type.Array(Type.String())),
    tags: Type.Optional(Type.Array(Type.String())),
    search: Type.Optional(Type.String()),
})

export type ListFlowTemplatesRequest = Static<typeof ListFlowTemplatesRequest>

export const GetFlowTemplateRequestQuery = Type.Object({
    versionId: Type.Optional(Type.String()),
})

export type GetFlowTemplateRequestQuery = Static<typeof GetFlowTemplateRequestQuery>

export const CreateFlowTemplateRequest = Type.Object({
    description: Type.Optional(Type.String()),
    template: FlowVersionTemplate,
    blogUrl: Type.Optional(Type.String()),
    type: Type.Enum(TemplateType),
    tags: Type.Optional(Type.Array(Type.String())),
    id: Type.Optional(Type.String()),
})

export type CreateFlowTemplateRequest = Static<typeof CreateFlowTemplateRequest>

export type TemplateTabProps = {
    activeTab: string
    selectActiveTab: (id: string) => void
}
