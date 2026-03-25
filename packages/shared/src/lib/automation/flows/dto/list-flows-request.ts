import { z } from 'zod'
import { OptionalArrayFromQuery } from '../../../core/common/base-model'
import { Cursor } from '../../../core/common/seek-page'
import { FlowStatus } from '../flow'
import { FlowVersionState } from '../flow-version'

export const ListFlowsRequest = z.object({
    folderId: z.string().optional(),
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
    status: OptionalArrayFromQuery(z.nativeEnum(FlowStatus)),
    projectId: z.string(),
    name: z.string().optional(),
    agentExternalIds: OptionalArrayFromQuery(z.string()),
    versionState: z.nativeEnum(FlowVersionState).optional(),
    connectionExternalIds: OptionalArrayFromQuery(z.string()),
    externalIds: OptionalArrayFromQuery(z.string()),
})

export type ListFlowsRequest = Omit<z.infer<typeof ListFlowsRequest>, 'cursor'> & { cursor: Cursor | undefined }

export const GetFlowQueryParamsRequest = z.object({
    versionId: z.string().optional(),
})

export type GetFlowQueryParamsRequest = z.infer<typeof GetFlowQueryParamsRequest>

export const ListFlowVersionRequest = z.object({
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
})

export type ListFlowVersionRequest = Omit<z.infer<typeof ListFlowVersionRequest>, 'cursor'> & { cursor: Cursor | undefined }
