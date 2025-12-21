/* eslint-disable @typescript-eslint/no-unused-vars */
import { AuthorizationForType, AuthorizationType, FastifyRouteSecurity, ProjectAuthorization, RequestProject, RouteAccessRequest, RouteKind } from '@activepieces/server-shared'
import { ApId, EndpointScope, MaybeProjectExtra, Permission, Principal, PrincipalForTypes, PrincipalForTypesV2, PrincipalType, PrincipalV2 } from '@activepieces/shared'
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
        ContextConfig extends { allowedPrincipals: infer P extends readonly PrincipalType[] }
            ? PrincipalForTypes<P>
            : ContextConfig['security'] extends { authorization: { allowedPrincipals: infer Q extends readonly PrincipalType[] } }
                ? ContextConfig['security'] extends { authorization: { type: AuthorizationType.PROJECT } }
                    ? PrincipalForTypesV2<Q> & { projectId: string }
                    : ContextConfig['security'] extends { authorization: { type: AuthorizationType.MAYBE_PROJECT } }
                        ? PrincipalForTypesV2<Q> & MaybeProjectExtra
                        : PrincipalForTypesV2<Q>
                : typeof ContextConfig['security'] extends undefined ? Principal : PrincipalV2
        

        // TODO(@Chaker): to be used in V2 
        // principal: ContextConfig['security'] extends { authorization: { type: AuthorizationType.ENGINE } }
        // ? PrincipalForType<PrincipalType.ENGINE> :
        // ContextConfig['security'] extends { authorization: { type: AuthorizationType.WORKER } }
        // ? PrincipalForType<PrincipalType.WORKER>
        // : ContextConfig['security'] extends { authorization: { allowedPrincipals: readonly (infer P extends PrincipalType)[] } }
        // ? PrincipalForType<P>
        // : Principal
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
        security?: FastifyRouteSecurity
        otel?: boolean

        // V1
        skipAuth?: boolean
        scope?: EndpointScope
        permission?: Permission
        allowedPrincipals?: readonly PrincipalType[]
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