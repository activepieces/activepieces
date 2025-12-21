import { Permission, PrincipalType } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'

export enum AuthorizationType {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
    MAYBE_PROJECT = 'MAYBE_PROJECT', // used to allow UNKNOWN and WORKER principals access to a route. adds the projectId to the request for other principals 
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

export type ProjectTableResource = {
    type: ProjectResourceType.TABLE
    tableName: EntitySchema<unknown>
    lookup?: {
        paramKey: string
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

export type MaybeProjectAuthorization = {
    type: AuthorizationType.MAYBE_PROJECT
    allowedPrincipals: readonly PrincipalType[]
    projectResource?: ProjectResource
    permission?: Permission
}

export type NoneAuthorization = {
    type: AuthorizationType.NONE
    reason: string
}

export type PublicRoute = {
    kind: RouteKind.PUBLIC
}