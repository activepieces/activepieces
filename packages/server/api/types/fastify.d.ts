/* eslint-disable @typescript-eslint/no-unused-vars */
import { AuthorizationForType, AuthorizationType, FastifyRouteSecurity, ProjectAuthorization, RequestProject, RouteAccessRequest, RouteKind } from '@activepieces/server-shared'
import { ApId, EndpointScope, MaybeProjectExtra, Permission, Principal, Principal, PrincipalForTypes, PrincipalForTypes, PrincipalType } from '@activepieces/shared'
import fastify, {
    RouteShorthandOptions as BaseRouteShorthandOptions,
    FastifyBaseLogger,
    FastifyRequest,
    RouteOptions as FastifyRouteOptions,
    FastifySchema,
    FastifyTypeProvider,
    FastifyTypeProviderDefault,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerBase,
    RawServerDefault,
    RouteGenericInterface,
} from 'fastify'
import { Server } from 'socket.io'

declare module 'fastify' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface FastifyRequest<
        RouteGeneric = unknown,
        RawServer = unknown,
        RawRequest = unknown,
        SchemaCompiler = unknown,
        TypeProvider = unknown,
        ContextConfig extends FastifyContextConfig = FastifyContextConfig,
        Logger = unknown,
        RequestType = unknown,
    > {
        principal:
        ContextConfig['security'] extends { authorization: { allowedPrincipals: infer Q extends readonly PrincipalType[] } }
            ? PrincipalForTypes<Q>
            : typeof ContextConfig['security'] extends undefined ? Principal : Principal
        
        projectId: ContextConfig['security'] extends { authorization: { type: AuthorizationType.PROJECT } } ? string : undefined
        rawBody?: string | Buffer
        isMultipart(): boolean
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface FastifyInstance {
        io: Server
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface FastifyContextConfig {
        rawBody?: boolean
        security: FastifyRouteSecurity
        otel?: boolean
    }
    

    export type RouteShorthandOptions<
        RawServer extends RawServerBase = RawServerDefault,
        RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
        RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
        RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
        ContextConfig extends FastifyContextConfig = FastifyContextConfig,
        SchemaCompiler extends FastifySchema = FastifySchema,
        TypeProvider extends FastifyTypeProvider = FastifyTypeProviderDefault,
        Logger extends FastifyBaseLogger = FastifyBaseLogger,
    > = {
        config: ContextConfig
    }
}