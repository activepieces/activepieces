/* eslint-disable @typescript-eslint/no-unused-vars */
import { EndpointScope, Permission, Principal, PrincipalForTypes, PrincipalType } from '@activepieces/shared'
import { AuthorizationType, ProjectAuthorization, FastifyRouteSecurity, RouteKind, RouteAccessRequest, AuthorizationForType, RequestProject } from '@activepieces/server-shared'
import fastify, { 
    RouteShorthandOptions as BaseRouteShorthandOptions, 
    FastifyBaseLogger, 
    RouteOptions as FastifyRouteOptions, 
    FastifySchema, 
    FastifyTypeProvider,
    FastifyTypeProviderDefault,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerBase,
    RawServerDefault,
    RouteGenericInterface,
    FastifyRequest,
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
        principal: ContextConfig extends { security: RouteAccessRequest }
            ? ContextConfig['security']['authorization'] extends { allowedPrincipals: readonly (infer P extends PrincipalType)[] }
                ? PrincipalForType<P>
                : Principal
            : Principal

        project: ContextConfig extends { security: RouteAccessRequest }
            ? ContextConfig['security']['authorization'] extends { type: AuthorizationType.PROJECT }
                ? { id: string }
                : undefined
            : undefined
        rawBody?: string | Buffer
        isMultipart(): boolean
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface FastifyInstance {
        io: Server
    }
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