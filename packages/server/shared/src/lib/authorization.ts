import { RouteGenericInterface } from 'fastify'
import { PrincipalType } from '../../../../shared/src/lib/authentication/model/principal-type'
import { Permission } from '../../../../shared/src/lib/common/security/permission'
import { ProjectId } from 'packages/shared/src/lib/project/project'

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

export type ProjectAuthorization<T extends RouteGenericInterface = RouteGenericInterface> = {
    type: AuthorizationType.PROJECT
    allowedPrincipals: (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]
    permission?: Permission
}

export type NoneAuthorization = {
    type: AuthorizationType.NONE
    reason: string
}

export type AuthorizationRule<T extends RouteGenericInterface = RouteGenericInterface> =
    | WorkerAuthorization
    | PlatformAuthorization
    | ProjectAuthorization<T>
    | NoneAuthorization


export enum RouteKind {
    AUTHENTICATED = 'AUTHENTICATED',
    PUBLIC = 'PUBLIC',
}

export type AuthenticatedRoute<T extends RouteGenericInterface = RouteGenericInterface> = {
    kind: RouteKind.AUTHENTICATED
    authorization: AuthorizationRule<T>
}

export type PublicRoute = {
    kind: RouteKind.PUBLIC
}

export type RouteSecurity<T extends RouteGenericInterface = RouteGenericInterface> = AuthenticatedRoute<T> | PublicRoute

