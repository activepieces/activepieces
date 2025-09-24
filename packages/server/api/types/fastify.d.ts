// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { EndpointScope, Permission, Principal, PrincipalType } from '@activepieces/shared'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fastify from 'fastify'
import { Server } from 'socket.io'

declare module 'fastify' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface FastifyRequest {
        principal: Principal
        rawBody?: string | Buffer
        isMultipart(): boolean
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface FastifyInstance {
        io: Server
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface FastifyContextConfig {
        allowedPrincipals?: PrincipalType[]
        rawBody?: boolean
        skipAuth?: boolean
        scope?: EndpointScope
        permission?: Permission
        otel?: boolean
    }
}
