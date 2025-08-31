import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../../common'
import { Metadata } from '../../common/metadata'
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
    metadata: Nullable(Metadata),
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