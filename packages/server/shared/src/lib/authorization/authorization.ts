import { ProjectId } from '@activepieces/shared'
import { EngineAuthorization, NoneAuthorization, PlatformAuthorization, ProjectAuthorization, PublicRoute, RouteKind, WorkerAuthorization } from './common'

export type ProjectAuthorizationConfig = Omit<ProjectAuthorization, 'projectResource'> & {
    projectId: ProjectId | undefined
}

type AuthorizationRuleConfig =
    | WorkerAuthorization
    | PlatformAuthorization
    | ProjectAuthorizationConfig
    | EngineAuthorization
    | NoneAuthorization


type AuthorizationRouteAccess = {
    kind: RouteKind.AUTHENTICATED
    authorization: AuthorizationRuleConfig
}

export type AuthorizationRouteSecurity = AuthorizationRouteAccess | PublicRoute
