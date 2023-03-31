// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fastify from 'fastify'
import { Principal } from '@activepieces/shared'

declare module 'fastify' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    export interface FastifyRequest {
        principal: Principal
    }
}
