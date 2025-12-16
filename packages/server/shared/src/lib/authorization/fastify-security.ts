import { Permission, PrincipalType } from '@activepieces/shared'
import { AuthorizationType, EngineAuthorization, NoneAuthorization, PlatformAuthorization, ProjectAuthorization, ProjectResource, PublicRoute, RouteKind, WorkerAuthorization } from './common'

type FastifySecurityAuthorization =
    | WorkerAuthorization
    | PlatformAuthorization
    | ProjectAuthorization
    | EngineAuthorization
    | NoneAuthorization

type RouteAccessRequest = {
    kind: RouteKind.AUTHENTICATED
    authorization: FastifySecurityAuthorization
}
    
export type FastifyRouteSecurity = RouteAccessRequest | PublicRoute


export function platformAdminOnly(allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]) {
    return {
        kind: RouteKind.AUTHENTICATED,
        authorization: {
            type: AuthorizationType.PLATFORM,
            allowedPrincipals,
            adminOnly: true,
        },
    } as const
}

export function publicPlatformAccess<const T extends readonly (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]>(allowedPrincipals: T) {
    return {
        kind: RouteKind.AUTHENTICATED,
        authorization: {
            type: AuthorizationType.PLATFORM,
            allowedPrincipals,
            adminOnly: false,
        },
    } as const
}

export function publicAccess() {
    return {
        kind: RouteKind.PUBLIC,
    } as const
}

export function projectAccess(allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.SERVICE | PrincipalType.ENGINE)[], permission: Permission | undefined, projectResource: ProjectResource) {
    return {
        kind: RouteKind.AUTHENTICATED,
        authorization: {
            type: AuthorizationType.PROJECT,
            allowedPrincipals,
            permission,
            projectResource,
        },
    } as const
}

export function engineAccess() {
    return {
        kind: RouteKind.AUTHENTICATED,
        authorization: {
            type: AuthorizationType.ENGINE,
        },
    } as const
}

export function workerAccess() {
    return {
        kind: RouteKind.AUTHENTICATED,
        authorization: {
            type: AuthorizationType.WORKER,
        },
    } as const
}