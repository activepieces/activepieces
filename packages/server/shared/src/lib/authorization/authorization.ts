import { ProjectId } from '@activepieces/shared'
import { NoneAuthorization, PlatformAuthorization, ProjectAuthorization, PublicRoute, RouteKind, UnscopedAuthorization } from './common'

export type ProjectAuthorizationConfig = Omit<ProjectAuthorization, 'projectResource'> & {
    projectId: ProjectId | undefined
}

type AuthorizationRuleConfig =
    | PlatformAuthorization
    | ProjectAuthorizationConfig
    | UnscopedAuthorization
    | NoneAuthorization

type AuthorizationRouteAccess = {
    kind: RouteKind.AUTHENTICATED
    authorization: AuthorizationRuleConfig
}

export type AuthorizationRouteSecurity = AuthorizationRouteAccess | PublicRoute
