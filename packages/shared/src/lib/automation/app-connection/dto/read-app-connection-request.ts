import { z } from 'zod'
import { OptionalArrayFromQuery } from '../../../core/common/base-model'
import { ProjectType } from '../../../management/project/project'
import { AppConnectionScope, AppConnectionStatus, AppConnectionWithoutSensitiveData } from '../app-connection'

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

export const ListPlatformAppConnectionsRequestQuery = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
    displayName: z.string().optional(),
    pieceName: z.string().optional(),
    scope: z.nativeEnum(AppConnectionScope).optional(),
    status: OptionalArrayFromQuery(z.nativeEnum(AppConnectionStatus)),
    projectIds: OptionalArrayFromQuery(z.string()),
    ownerIds: OptionalArrayFromQuery(z.string()),
})
export type ListPlatformAppConnectionsRequestQuery = z.infer<typeof ListPlatformAppConnectionsRequestQuery>

export const PlatformAppConnectionProjectInfo = z.object({
    id: z.string(),
    displayName: z.string(),
    type: z.nativeEnum(ProjectType),
})
export type PlatformAppConnectionProjectInfo = z.infer<typeof PlatformAppConnectionProjectInfo>

export const PlatformAppConnectionsListItem = AppConnectionWithoutSensitiveData.extend({
    projects: z.array(PlatformAppConnectionProjectInfo),
})
export type PlatformAppConnectionsListItem = z.infer<typeof PlatformAppConnectionsListItem>

export const PlatformAppConnectionOwner = z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
})
export type PlatformAppConnectionOwner = z.infer<typeof PlatformAppConnectionOwner>

export const PlatformAppConnectionOwnersResponse = z.object({
    data: z.array(PlatformAppConnectionOwner),
    truncated: z.boolean(),
})
export type PlatformAppConnectionOwnersResponse = z.infer<typeof PlatformAppConnectionOwnersResponse>

export const MAX_PLATFORM_APP_CONNECTION_OWNERS = 1000
