import { Permission, PrincipalType } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'

export enum AuthorizationType {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
    UNSCOPED = 'UNSCOPED',
    NONE = 'NONE',
}

export enum ProjectResourceType {
    TABLE = 'TABLE',
    QUERY = 'QUERY',
    BODY = 'BODY',
    PARAM = 'PARAM',
}

export enum RouteKind {
    AUTHENTICATED = 'AUTHENTICATED',
    PUBLIC = 'PUBLIC',
}

export enum EntitySourceType {
    PARAM = 'PARAM',
    QUERY = 'QUERY',
    BODY = 'BODY',
}

export type ProjectTableResource = {
    type: ProjectResourceType.TABLE
    tableName: EntitySchema<unknown>
    entitySourceType?: EntitySourceType // defaults to PARAM
    lookup?: {
        paramKey: string // defaults to id
        entityField: string
    }
}

export type ProjectQueryResource = {
    type: ProjectResourceType.QUERY
    queryKey?: string // defaults to projectId
}

export type ProjectBodyResource = {
    type: ProjectResourceType.BODY
    bodyKey?: string // defaults to projectId
}

export type ProjectParamResource = {
    type: ProjectResourceType.PARAM
    paramKey?: string // defaults to projectId
}

export type ProjectResource = ProjectTableResource | ProjectQueryResource | ProjectBodyResource | ProjectParamResource

export type PlatformAuthorization = {
    type: AuthorizationType.PLATFORM
    adminOnly: boolean
    allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]
}

export type ProjectAuthorization = {
    type: AuthorizationType.PROJECT
    allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]
    projectResource: ProjectResource
    permission?: Permission
}

export type UnscopedAuthorization = {
    type: AuthorizationType.UNSCOPED
    allowedPrincipals: readonly PrincipalType[]
}

export type NoneAuthorization = {
    type: AuthorizationType.NONE
    reason: string
}

export type PublicRoute = {
    kind: RouteKind.PUBLIC
}