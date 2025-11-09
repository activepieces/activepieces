import { PrincipalType, Permission } from '@activepieces/shared'

export enum AuthorizationType {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
    WORKER = 'WORKER',
    NONE = 'NONE',
}

export enum ProjectResourceType {
    TABLE = 'TABLE',
    QUERY = 'QUERY',
    BODY = 'BODY',
}

export type ProjectTableResource = {
    type: ProjectResourceType.TABLE
    tableName: string
}

export type ProjectQueryResource = {
    type: ProjectResourceType.QUERY
    key: string
}

export type ProjectBodyResource = {
    type: ProjectResourceType.BODY
    key: string
}

export type ProjectResource = ProjectTableResource | ProjectQueryResource | ProjectBodyResource

export type WorkerAuthorization = {
    type: AuthorizationType.WORKER
}

export type PlatformAuthorization = {
    type: AuthorizationType.PLATFORM
    allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]
}

export type ProjectAuthorization = {
    type: AuthorizationType.PROJECT
    allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]
    projectResource: ProjectResource
    permission?: Permission
}

export type NoneAuthorization = {
    type: AuthorizationType.NONE
    reason: string
}

export type AuthorizationRule =
    | WorkerAuthorization
    | PlatformAuthorization
    | ProjectAuthorization
    | NoneAuthorization


export enum RouteKind {
    AUTHENTICATED = 'AUTHENTICATED',
    PUBLIC = 'PUBLIC',
}

export type AuthenticatedRoute = {
    kind: RouteKind.AUTHENTICATED
    authorization: AuthorizationRule
}

export type PublicRoute = {
    kind: RouteKind.PUBLIC
}

export type RouteSecurity = AuthenticatedRoute | PublicRoute

