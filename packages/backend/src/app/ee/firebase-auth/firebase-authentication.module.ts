import { firebaseAuthenticationController } from './firebase-authentication.controller'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

export const firebaseAuthenticationModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(firebaseAuthenticationController, { prefix: '/v1/firebase' })
}
