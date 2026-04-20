import { z } from 'zod'
import { Nullable } from '../../../core/common'
import { OptionalArrayFromQuery } from '../../../core/common/base-model'
import { formErrors } from '../../../form-errors'
import { FieldState } from '../../project-release/project-state'
import { TableAutomationStatus, TableAutomationTrigger } from '../table'
import { TableWebhookEventType } from '../table-webhook'

const SAFE_EXTERNAL_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/

export const CreateTableRequest = z.object({
    projectId: z.string(),
    name: z.string(),
    fields: z.array(FieldState).optional(),
    externalId: z.string().regex(SAFE_EXTERNAL_ID_PATTERN, formErrors.invalidExternalId).optional(),
    folderId: z.string().optional(),
    folderName: z.string().optional(),
})

export type CreateTableRequest = z.infer<typeof CreateTableRequest>

export const ExportTableResponse = z.object({
    fields: z.array(z.object({ id: z.string(), name: z.string() })),
    rows: z.array(z.record(z.string(), z.string())),
    name: z.string(),
})

export type ExportTableResponse = z.infer<typeof ExportTableResponse>

export const CreateTableWebhookRequest = z.object({
    events: z.array(z.nativeEnum(TableWebhookEventType)),
    webhookUrl: z.string(),
    flowId: z.string(),
})

export type CreateTableWebhookRequest = z.infer<typeof CreateTableWebhookRequest>

export const UpdateTableRequest = z.object({
    name: z.string().optional(),
    trigger: z.nativeEnum(TableAutomationTrigger).optional(),
    status: z.nativeEnum(TableAutomationStatus).optional(),
    folderId: Nullable(z.string()),
})

export type UpdateTableRequest = z.infer<typeof UpdateTableRequest>


export const ListTablesRequest = z.object({
    projectId: z.string(),
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
    name: z.string().optional(),
    externalIds: OptionalArrayFromQuery(z.string()),
    folderId: z.string().optional(),
})

export type ListTablesRequest = z.infer<typeof ListTablesRequest>

export const CountTablesRequest = z.object({
    projectId: z.string(),
    folderId: z.string().optional(),
})

export type CountTablesRequest = z.infer<typeof CountTablesRequest>
