import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { jwtAuthnController } from './jwt-authn-controller'

export const jwtAuthnModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(jwtAuthnController, { prefix: '/v1/jwt-authn' })
} 