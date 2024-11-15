import { Static, Type } from '@sinclair/typebox'
import { AppConnectionScope, AppConnectionStatus } from '../app-connection'

export const ListAppConnectionsRequestQuery = Type.Object({
    cursor: Type.Optional(Type.String({})),
    projectId: Type.String(),
    scope: Type.Optional(Type.Enum(AppConnectionScope)),
    pieceName: Type.Optional(Type.String({})),
    displayName: Type.Optional(Type.String({})),
    status: Type.Optional(Type.Array(Type.Enum(AppConnectionStatus))),
    limit: Type.Optional(Type.Number({})),
})
export type ListAppConnectionsRequestQuery = Static<
  typeof ListAppConnectionsRequestQuery
>

export const GetAppConnectionForWorkerRequestQuery = Type.Object({
    externalId: Type.String(),
})
export type GetAppConnectionForWorkerRequestQuery = Static<
    typeof GetAppConnectionForWorkerRequestQuery
>

export const ListGlobalConnectionsRequestQuery = Type.Omit(ListAppConnectionsRequestQuery, ['projectId'])
export type ListGlobalConnectionsRequestQuery = Static<typeof ListGlobalConnectionsRequestQuery>