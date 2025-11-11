import { ProjectId } from "@activepieces/shared"
import { NoneAuthorization, PlatformAuthorization, ProjectAuthorization, PublicRoute, RouteKind, WorkerAuthorization } from "./common"

export type ProjectAuthorizationConfig = Omit<ProjectAuthorization, 'projectResource'> & {
    projectId: ProjectId | undefined
}

type AuthorizationRuleConfig =
    | WorkerAuthorization
    | PlatformAuthorization
    | ProjectAuthorizationConfig
    | NoneAuthorization


type AuthorizationRouteAccess = {
    kind: RouteKind.AUTHENTICATED
    authorization: AuthorizationRuleConfig
}

export type AuthorizationRouteSecurity = AuthorizationRouteAccess | PublicRoute

