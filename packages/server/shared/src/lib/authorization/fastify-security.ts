import { Permission, PrincipalType } from '@activepieces/shared'
import { AuthorizationType, NoneAuthorization, PlatformAuthorization, ProjectAuthorization, ProjectResource, PublicRoute, RouteKind, UnscopedAuthorization } from './common'

type FastifySecurityAuthorization =
    | PlatformAuthorization
    | ProjectAuthorization
    | UnscopedAuthorization
    | NoneAuthorization

type RouteAccessRequest = {
    kind: RouteKind.AUTHENTICATED
    authorization: FastifySecurityAuthorization
}
    
export type FastifyRouteSecurity = RouteAccessRequest | PublicRoute

export const securityAccess = {

    platformAdminOnly: (allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]) => {
        return {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PLATFORM,
                allowedPrincipals,
                adminOnly: true,
            },
        } as const
    },
    
    publicPlatform: (allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.ENGINE | PrincipalType.SERVICE)[]) => {
        return {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PLATFORM,
                allowedPrincipals,
                adminOnly: false,
            },
        } as const
    },
    
    public: () => {
        return {
            kind: RouteKind.PUBLIC,
        } as const
    },
    
    project: (allowedPrincipals: readonly (PrincipalType.USER | PrincipalType.SERVICE | PrincipalType.ENGINE)[], permission: Permission | undefined, projectResource: ProjectResource) => {
        return {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                allowedPrincipals,
                permission,
                projectResource,
            },
        } as const
    },
    
    unscoped: <T extends readonly PrincipalType[]>(allowedPrincipals: T) => {
        return {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.UNSCOPED,
                allowedPrincipals,
            },
        } as const
    },
    
    engine: () => {
        return securityAccess.unscoped([PrincipalType.ENGINE])
    },
    
    worker: () => {
        return securityAccess.unscoped([PrincipalType.WORKER])
    },
}
