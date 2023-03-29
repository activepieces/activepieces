// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fastify from 'fastify';
import { Principal } from '@activepieces/shared';

declare module 'fastify' {
    export interface FastifyRequest {
        principal: Principal;
    }
}
