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

    /**
     * Creates a security configuration that restricts access to platform administrators only.
     *
     * **Conditions for access:**
     * - Principal type of token must be one of the allowedPrincipals
     * - User with principal.id must be owner of the platform with id principal.platformId
     *
     * **Effects:**
     * - platformId field is available on the request.principal (request.principal.platformId)
     *
     * @param allowedPrincipals - Array of allowed principal types (USER, ENGINE, or SERVICE)
     * @returns Security configuration for platform admin-only routes
     */
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
    
    /**
     * Creates a security configuration for public platform routes.
     *
     * **Conditions for access:**
     * - Principal type of token must be one of the allowedPrincipals
     *
     * **Effects:**
     * - platformId field is available on the request.principal (request.principal.platformId)
     *
     * @param allowedPrincipals - Array of allowed principal types (USER, ENGINE, or SERVICE)
     * @returns Security configuration for public platform routes
     */
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
    
    /**
     * Creates a security configuration for public routes that require no authentication.
     *
     * **Conditions for access:**
     * - No authentication token required
     *
     * @returns Security configuration for public routes
     */
    public: () => {
        return {
            kind: RouteKind.PUBLIC,
        } as const
    },
    
    /**
     * Creates a security configuration for project-scoped routes.
     *
     * **Pre-check:**
     * - Extract projectId from the request based on projectResource
     *   - ProjectTableResource: uses a db table to get projectId of the entity with id specified in the request body, query or param
     *   - ProjectQueryResource: gets projectId from the query string
     *   - ProjectBodyResource: gets projectId from the request body
     *   - ProjectParamResource: gets projectId from the request param
     *
     * **Conditions for access:**
     * - Principal type of token must be one of the allowedPrincipals
     * - User with principal.id must be member of project with the extracted projectId
     * - If permission is provided, user with principal.id must have the permission on the project with the extracted projectId
     *
     * **Effects:**
     * - projectId field is available on the request object (request.projectId)
     *
     * @param allowedPrincipals - Array of allowed principal types (USER, SERVICE, or ENGINE)
     * @param permission - Optional permission required for access
     * @param projectResource - Resource configuration for extracting projectId from the request
     * @returns Security configuration for project-scoped routes
     */
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
    
    /**
     * Creates a security configuration for unscoped routes that do not require platformId or projectId.
     *
     * Mainly used for routes that do not require platformId or projectId appended on the request object.
     * This is useful when we need a route that allows Worker principal + other principals because the
     * worker principal token does not contain platformId or projectId.
     *
     * **Conditions for access:**
     * - Principal type of token must be one of the allowedPrincipals
     *
     * **Effects:**
     * - No effects (platformId and projectId are not available on the request object)
     *
     * @param allowedPrincipals - Array of allowed principal types
     * @returns Security configuration for unscoped routes
     */
    unscoped: <T extends readonly PrincipalType[]>(allowedPrincipals: T) => {
        return {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.UNSCOPED,
                allowedPrincipals,
            },
        } as const
    },
    
    /**
     * Creates a security configuration for routes that are only accessible to Engine principal.
     *
     * **Effects:**
     * - projectId field is available on the request.principal because the engine principal token contains projectId
     *
     * @returns Security configuration for engine-only routes
     */
    engine: () => {
        return securityAccess.unscoped([PrincipalType.ENGINE])
    },
    
    /**
     * Creates a security configuration for routes that are only accessible to Worker principal.
     *
     * @returns Security configuration for worker-only routes
     */
    worker: () => {
        return securityAccess.unscoped([PrincipalType.WORKER])
    },
}
