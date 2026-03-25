import { z } from 'zod'
import { OptionalArrayFromQuery } from '../../../core/common/base-model'
import { AppConnectionScope, AppConnectionStatus } from '../app-connection'

export const ListAppConnectionsRequestQuery = z.object({
    cursor: z.string().optional(),
    projectId: z.string(),
    scope: z.nativeEnum(AppConnectionScope).optional(),
    pieceName: z.string().optional(),
    displayName: z.string().optional(),
    status: OptionalArrayFromQuery(z.nativeEnum(AppConnectionStatus)),
    limit: z.coerce.number().optional(),
})

export type ListAppConnectionsRequestQuery = z.infer<
  typeof ListAppConnectionsRequestQuery
>

export const GetAppConnectionForWorkerRequestQuery = z.object({
    externalId: z.string(),
})
export type GetAppConnectionForWorkerRequestQuery = z.infer<
    typeof GetAppConnectionForWorkerRequestQuery
>

export const ListGlobalConnectionsRequestQuery = ListAppConnectionsRequestQuery.omit({ projectId: true })
export type ListGlobalConnectionsRequestQuery = z.infer<typeof ListGlobalConnectionsRequestQuery>

export const ListAppConnectionOwnersRequestQuery = z.object({
    projectId: z.string(),
})
export type ListAppConnectionOwnersRequestQuery = z.infer<typeof ListAppConnectionOwnersRequestQuery>
