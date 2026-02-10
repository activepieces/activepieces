import { Omit, Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, ColorHex, Metadata, Nullable } from '../common'
import { Note } from '../flows'
import { FlowVersion } from '../flows/flow-version'
import { TableState } from '../project-release/project-state'

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
    ['id', 'created', 'updated', 'flowId', 'state', 'updatedBy', 'agentIds', 'connectionIds', 'backupFiles', 'notes'],
), Type.Object({
    description: Type.Optional(Type.String()),
    //notes were optional for old json templates
    notes: Type.Optional(Type.Array(Note)),
})])
export type FlowVersionTemplate = Static<typeof FlowVersionTemplate>

export enum TemplateStatus {
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export enum TableImportDataType {
    CSV = 'CSV',
}

export const TableDataState = Type.Object({
    type: Type.Enum(TableImportDataType),
    rows: Type.Array(Type.Array(Type.Object({
        fieldId: Type.String(),
        value: Type.String(),
    }))),
})
export type TableDataState = Static<typeof TableDataState>

export const TableTemplate = Type.Composite([Type.Omit(TableState, ['id', 'created', 'updated']), Type.Object({
    data: Nullable(TableDataState),
})])
export type TableTemplate = Static<typeof TableTemplate>

export const Template = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    type: Type.Enum(TemplateType),
    summary: Type.String(),
    description: Type.String(),
    tags: Type.Array(TemplateTag),
    blogUrl: Nullable(Type.String()),
    metadata: Nullable(Metadata),
    author: Type.String(),
    categories: Type.Array(Type.String()),
    pieces: Type.Array(Type.String()),
    platformId: Nullable(Type.String()),
    flows: Type.Optional(Type.Array(FlowVersionTemplate)),
    tables: Type.Optional(Type.Array(TableTemplate)),
    status: Type.Enum(TemplateStatus),
})
export type Template = Static<typeof Template>

export const SharedTemplate = Omit(Template, ['platformId', 'id', 'created', 'updated'])
export type SharedTemplate = Static<typeof SharedTemplate>