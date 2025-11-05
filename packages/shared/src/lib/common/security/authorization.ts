import { PrincipalType } from '../../authentication/model/principal-type'
import { Permission } from './permission'

export enum AuthorizationType {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
    WORKER = 'WORKER',
    NONE = 'NONE',
}

export type WorkerAuthorization = {
    type: AuthorizationType.WORKER
}

export type PlatformAuthorization = {
    type: AuthorizationType.PLATFORM
    allowedPrincipals: (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]
}

export type ProjectAuthorization = {
    type: AuthorizationType.PROJECT
    allowedPrincipals: (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]
    project: {
        projectId: (request: unknown) => string
        permission: Permission
    }
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

