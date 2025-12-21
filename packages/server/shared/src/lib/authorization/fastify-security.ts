import { Permission, PrincipalType } from '@activepieces/shared'
import { AuthorizationType, MaybeProjectAuthorization, NoneAuthorization, PlatformAuthorization, ProjectAuthorization, ProjectResource, PublicRoute, RouteKind, UnscopedAuthorization } from './common'

type FastifySecurityAuthorization =
    | PlatformAuthorization
    | ProjectAuthorization
    | MaybeProjectAuthorization
    | UnscopedAuthorization
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

export function publicPlatformAccess(allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]) {
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



export function unscopedAccess<T extends readonly PrincipalType[]>(allowedPrincipals: T) {
    return {
        kind: RouteKind.AUTHENTICATED,
        authorization: {
            type: AuthorizationType.UNSCOPED,
            allowedPrincipals,
        },
    } as const
}

export function engineAccess() {
    return unscopedAccess<[PrincipalType.ENGINE]>([PrincipalType.ENGINE])
}

export function workerAccess() {
    return unscopedAccess<[PrincipalType.WORKER]>([PrincipalType.WORKER])
}

/**
 * This is used to allow access to the route for all principals.
 * and optionally add the projectId to the request.principal if the principal type supports it.
 */
export function maybeProjectAccess(allowedPrincipals: readonly PrincipalType[], permission?: Permission, projectResource?: ProjectResource) {
    return {
        kind: RouteKind.AUTHENTICATED,
        authorization: {
            type: AuthorizationType.MAYBE_PROJECT,
            allowedPrincipals,
            projectResource,
            permission,
        },
    } as const
}