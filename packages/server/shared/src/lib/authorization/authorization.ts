import { ProjectId } from '@activepieces/shared'
import { MaybeProjectAuthorization, NoneAuthorization, PlatformAuthorization, ProjectAuthorization, PublicRoute, RouteKind, UnscopedAuthorization } from './common'

export type ProjectAuthorizationConfig = Omit<ProjectAuthorization, 'projectResource'> & {
    projectId: ProjectId | undefined
}

export type MaybeProjectAuthorizationConfig = MaybeProjectAuthorization & { // we need to keep the projectResource here to check later whether to assert access to project or not
    projectId: ProjectId | undefined
}

type AuthorizationRuleConfig =
    | PlatformAuthorization
    | ProjectAuthorizationConfig
    | MaybeProjectAuthorizationConfig
    | UnscopedAuthorization
    | NoneAuthorization

type AuthorizationRouteAccess = {
    kind: RouteKind.AUTHENTICATED
    authorization: AuthorizationRuleConfig
}

export type AuthorizationRouteSecurity = AuthorizationRouteAccess | PublicRoute
