import { z } from 'zod'
import { Note } from '../../automation/flows'
import { FlowVersion } from '../../automation/flows/flow-version'
import { BaseModelSchema, ColorHex, Metadata, Nullable } from '../../core/common'

export const TemplateTag = z.object({
    title: z.string(),
    color: ColorHex,
    icon: z.string().optional(),
})
export type TemplateTag = z.infer<typeof TemplateTag>


export enum TemplateType {
    OFFICIAL = 'OFFICIAL',
    SHARED = 'SHARED',
    CUSTOM = 'CUSTOM',
}

export const FlowVersionTemplate = FlowVersion.omit({
    id: true,
    created: true,
    updated: true,
    flowId: true,
    state: true,
    updatedBy: true,
    agentIds: true,
    connectionIds: true,
    backupFiles: true,
    notes: true,
}).extend({
    description: z.string().optional(),
    //notes were optional for old json templates
    notes: z.array(Note).optional(),
})
export type FlowVersionTemplate = z.infer<typeof FlowVersionTemplate>

export enum TemplateStatus {
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export enum TableImportDataType {
    CSV = 'CSV',
}

export const TableDataState = z.object({
    type: z.nativeEnum(TableImportDataType),
    rows: z.array(z.array(z.object({
        fieldId: z.string(),
        value: z.string(),
    }))),
})
export type TableDataState = z.infer<typeof TableDataState>

export const TableTemplate = z.object({
    name: z.string(),
    externalId: z.string(),
    fields: z.array(z.object({
        name: z.string(),
        type: z.string(),
        data: z.object({
            options: z.array(z.object({
                value: z.string(),
            })),
        }).nullable().optional(),
        externalId: z.string(),
    })),
    status: Nullable(z.string()),
    trigger: Nullable(z.string()),
    data: Nullable(TableDataState),
})
export type TableTemplate = z.infer<typeof TableTemplate>

export const Template = z.object({
    ...BaseModelSchema,
    name: z.string(),
    type: z.nativeEnum(TemplateType),
    summary: z.string(),
    description: z.string(),
    tags: z.array(TemplateTag),
    blogUrl: Nullable(z.string()),
    metadata: Nullable(Metadata),
    author: z.string(),
    categories: z.array(z.string()),
    pieces: z.array(z.string()),
    platformId: Nullable(z.string()),
    flows: z.array(FlowVersionTemplate).optional(),
    tables: z.array(TableTemplate).optional(),
    status: z.nativeEnum(TemplateStatus),
})
export type Template = z.infer<typeof Template>

export const SharedTemplate = Template.omit({ platformId: true, id: true, created: true, updated: true })
export type SharedTemplate = z.infer<typeof SharedTemplate>
