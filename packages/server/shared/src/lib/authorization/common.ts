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
}

export enum RouteKind {
    AUTHENTICATED = 'AUTHENTICATED',
    PUBLIC = 'PUBLIC',
}

export type ProjectTableResource = {
    type: ProjectResourceType.TABLE
    tableName: EntitySchema<unknown>
}

export type ProjectQueryResource = {
    type: ProjectResourceType.QUERY
}

export type ProjectBodyResource = {
    type: ProjectResourceType.BODY
}

export type ProjectResource = ProjectTableResource | ProjectQueryResource | ProjectBodyResource

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