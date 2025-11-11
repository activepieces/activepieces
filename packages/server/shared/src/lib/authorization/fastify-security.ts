import { NoneAuthorization, PlatformAuthorization, ProjectAuthorization, PublicRoute, RouteKind, WorkerAuthorization } from "./common";

type FastifySecurityAuthorization =
    | WorkerAuthorization
    | PlatformAuthorization
    | ProjectAuthorization
    | NoneAuthorization

type RouteAccessRequest = {
    kind: RouteKind.AUTHENTICATED
    authorization: FastifySecurityAuthorization
}
    
export type FastifyRouteSecurity = RouteAccessRequest | PublicRoute
